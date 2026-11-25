-- =============================================================================
-- Which day(s) a guest will attend. The wedding runs over two days (in the
-- schedule): 'first' = the first day only, 'second' = the last day only,
-- 'both' = both (also every reply given before this was asked).
-- Tables are for the reception on the last day: first-day-only guests get none.
-- =============================================================================

alter table public.rsvps
  add column days text not null default 'both'
    check (days in ('both', 'first', 'second'));

-- Needs a table: accepted, and coming on the reception day.
create function private.needs_table(p_guest_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.rsvps r
    where r.guest_id = p_guest_id and r.attending and r.days <> 'first'
  );
$$;

revoke execute on function private.needs_table(uuid) from public, anon, authenticated;


-- Seating: only guests who need a table ---------------------------------------
create or replace function private.seat_guest(p_guest_id uuid)
returns int
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  g public.guests;
  s public.settings;
  chosen int;
begin
  perform private.lock_seating();
  select * into g from public.guests where id = p_guest_id;
  if g.id is null or g.deleted_at is not null then
    return null;
  end if;
  if g.table_no is not null then
    return g.table_no;
  end if;
  if not private.needs_table(g.id) then
    return null;
  end if;

  select * into s from public.settings limit 1;
  select t into chosen
    from generate_series(1, s.table_count) as t
   where private.capacity(t) - private.used_seats(t) >= private.seats(g.partner_name)
   order by private.capacity(t) - private.used_seats(t), t
   limit 1;

  if chosen is not null then
    update public.guests set table_no = chosen where id = g.id;
  end if;
  return chosen;
end;
$$;

create or replace function private.seat_all_waiting()
returns int
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  waiting record;
  seated int := 0;
begin
  for waiting in
    select g.id
      from public.guests g
      join public.rsvps r on r.guest_id = g.id and r.attending and r.days <> 'first'
     where g.deleted_at is null and g.table_no is null
     order by private.seats(g.partner_name) desc, r.responded_at, g.created_at
  loop
    if private.seat_guest(waiting.id) is not null then
      seated := seated + 1;
    end if;
  end loop;
  return seated;
end;
$$;

create or replace function private.guests_before_seating()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.deleted_at is not null then
    new.table_no := null;
    new.table_locked := false;
    return new;
  end if;

  if new.table_no is null then
    new.table_locked := false;
    return new;
  end if;

  if tg_op = 'INSERT' or new.table_no is distinct from old.table_no then
    if not exists (select 1 from public.rsvps r where r.guest_id = new.id and r.attending) then
      raise exception 'not_attending';
    end if;
    if not private.needs_table(new.id) then
      raise exception 'not_at_reception';
    end if;
    return new;
  end if;

  if private.seats(new.partner_name) > private.seats(old.partner_name) then
    perform private.lock_seating();
    if private.used_seats(new.table_no) + 1 > private.capacity(new.table_no) then
      new.table_no := null;
      new.table_locked := false;
    end if;
  end if;
  return new;
end;
$$;

-- Replies: needing a table seats the guest; declining, coming on the first
-- day only, or a removed reply frees the seat.
create or replace function private.rsvps_seating()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    update public.guests set table_no = null where id = old.guest_id and table_no is not null;
    return null;
  end if;
  if new.attending and new.days <> 'first' then
    perform private.seat_guest(new.guest_id);
  else
    update public.guests set table_no = null where id = new.guest_id and table_no is not null;
  end if;
  return null;
end;
$$;

drop trigger rsvps_seating on public.rsvps;
create trigger rsvps_seating
  after insert or update of attending, days or delete on public.rsvps
  for each row execute function private.rsvps_seating();


-- The reply, now with the days ------------------------------------------------
drop function public.submit_rsvp(text, boolean, text);

create function public.submit_rsvp(
  p_token     text,
  p_attending boolean,
  p_wish      text default '',
  p_days      text default 'both'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  g public.guests := private.guest_for_token(p_token);
  msg text := trim(coalesce(p_wish, ''));
  chosen_days text := coalesce(p_days, 'both');
  result public.rsvps;
  wish public.wishes;
begin
  if g.id is null then
    raise exception 'invalid_token';
  end if;
  if p_attending is null then
    raise exception 'answer_required';
  end if;
  if chosen_days not in ('both', 'first', 'second') then
    raise exception 'days_invalid';
  end if;
  if now() > (select countdown_at from public.settings) then
    raise exception 'rsvp_closed';
  end if;
  -- Declining: the days don't matter.
  if not p_attending then
    chosen_days := 'both';
  end if;

  -- Words of love switched off: there is nowhere to show a wish.
  if not (select show_wishes from public.settings) then
    msg := '';
  end if;
  if msg <> '' then
    if length(msg) > 500 then
      raise exception 'message_length';
    end if;
    if private.contains_link(msg) then
      raise exception 'links_not_allowed';
    end if;
    if (select count(*) from public.wishes
        where guest_id = g.id and created_at > now() - interval '1 hour') >= 5 then
      raise exception 'rate_limited';
    end if;
  end if;

  insert into public.rsvps as r (guest_id, attending, days)
  values (g.id, p_attending, chosen_days)
  on conflict (guest_id) do update
    set attending    = excluded.attending,
        days         = excluded.days,
        responded_at = now()
  returning r.* into result;

  if msg <> '' then
    insert into public.wishes (guest_id, message)
    values (g.id, msg)
    returning * into wish;
  end if;

  return jsonb_build_object(
    'attending', result.attending,
    'days', result.days,
    'table_no', (select table_no from public.guests where id = g.id),
    'wish', case when wish.id is null then null else jsonb_build_object(
      'id', wish.id,
      'message', wish.message,
      'created_at', wish.created_at,
      'author', private.short_names(g.name, g.partner_name),
      'mine', true
    ) end
  );
end;
$$;

grant execute on function public.submit_rsvp(text, boolean, text, text) to anon, authenticated;


-- The studio's guest list: the days at the end --------------------------------
create or replace view public.guest_list
with (security_invoker = true)
as
select
  g.id,
  g.name,
  g.phone,
  g.lang,
  g.token,
  g.pass_code,
  g.invite_sent_at,
  g.first_opened_at,
  g.last_opened_at,
  g.open_count,
  g.deleted_at,
  g.created_at,
  r.attending,
  r.responded_at,
  (select max(c.checked_in_at) from public.checkins c where c.guest_id = g.id) as last_checked_in_at,
  g.partner_name,
  g.partner_phone,
  private.seats(g.partner_name) as seats,
  g.table_no,
  g.table_locked,
  r.days
from public.guests g
left join public.rsvps r on r.guest_id = g.id;


-- Dashboard: people expected on each day --------------------------------------
create or replace function public.dashboard_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.require_admin();
  return (
    select jsonb_build_object(
      'invited',    count(*),
      'sent',       count(*) filter (where g.invite_sent_at is not null),
      'opened',     count(*) filter (where g.first_opened_at is not null),
      'attending',  count(*) filter (where r.attending is true),
      'declined',   count(*) filter (where r.attending is false),
      'pending',    count(*) filter (where r.guest_id is null),
      'checked_in', count(*) filter (where exists (
                      select 1 from public.checkins c where c.guest_id = g.id)),
      'invited_people',    coalesce(sum(private.seats(g.partner_name)), 0),
      'attending_people',  coalesce(sum(private.seats(g.partner_name)) filter (where r.attending is true), 0),
      'people_first',      coalesce(sum(private.seats(g.partner_name))
                             filter (where r.attending is true and r.days <> 'second'), 0),
      'people_second',     coalesce(sum(private.seats(g.partner_name))
                             filter (where r.attending is true and r.days <> 'first'), 0),
      'checked_in_people', coalesce(sum(private.seats(g.partner_name)) filter (where exists (
                             select 1 from public.checkins c where c.guest_id = g.id)), 0),
      'wishes',     (select count(*) from public.wishes),
      'gifts',      (select count(*) from public.gift_announcements)
    )
    from public.guests g
    left join public.rsvps r on r.guest_id = g.id
    where g.deleted_at is null
  );
end;
$$;


-- The pass at the door: the days too -------------------------------------------
create or replace function public.read_pass(p_code text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'first_name', private.short_names(g.name, g.partner_name),
    'seats',      private.seats(g.partner_name),
    'attending',  r.attending,          -- true, false, or null (no reply yet)
    'days',       r.days,
    'table_no',   g.table_no,
    'checked_in', exists (select 1 from public.checkins c where c.guest_id = g.id)
  )
  from public.guests g
  left join public.rsvps r on r.guest_id = g.id
  where g.pass_code = upper(trim(p_code))
    and g.deleted_at is null;
$$;


-- The guest's invitation: the reply includes the days --------------------------
create or replace function public.get_invitation(p_token text, p_preview boolean default false)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  g public.guests;
begin
  g := private.guest_for_token(p_token);
  if g.id is null then
    return null;
  end if;

  if not (p_preview and public.is_admin()) then
    update public.guests
       set open_count      = open_count + 1,
           first_opened_at = coalesce(first_opened_at, now()),
           last_opened_at  = now()
     where id = g.id;
  end if;

  return jsonb_build_object(
    'guest', jsonb_build_object(
      'name',         g.name,
      'partner_name', g.partner_name,
      'lang',         g.lang,
      'pass_code',    g.pass_code,
      'table_no',     g.table_no
    ),

    'rsvp', (
      select jsonb_build_object('attending', r.attending, 'days', r.days)
      from public.rsvps r
      where r.guest_id = g.id
    ),

    -- Guest book: visible messages, authors' first names only, newest first.
    'wishes', coalesce((
      select jsonb_agg(w order by w.created_at desc)
      from (
        select wi.id,
               wi.message,
               wi.created_at,
               private.short_names(author.name, author.partner_name) as author,
               wi.guest_id = g.id as mine
        from public.wishes wi
        join public.guests author on author.id = wi.guest_id
        where not wi.hidden
          and author.deleted_at is null
        order by wi.created_at desc
        limit 300
      ) w
    ), '[]'::jsonb),

    -- The couple's settings, minus what guests don't need to see.
    'settings', (
      select to_jsonb(s) - 'id' - 'wa_template_en' - 'wa_template_fr'
             - 'wa_template_couple_en' - 'wa_template_couple_fr' - 'updated_at'
      from public.settings s
    ),

    'events', coalesce((
      select jsonb_agg(
               jsonb_build_object(
                 'id', e.id, 'title_en', e.title_en, 'title_fr', e.title_fr,
                 'starts_at', e.starts_at, 'ends_at', e.ends_at,
                 'venue', e.venue, 'maps_url', e.maps_url
               )
               order by e.starts_at, e.sort
             )
      from public.events e
      where e.visible
    ), '[]'::jsonb),

    -- How many gifts are on the gift list (the list itself loads on its own page).
    'registry_count', (select count(*) from public.registry_gifts),

    'gallery', coalesce((
      select jsonb_agg(
               jsonb_build_object('id', p.id, 'path', p.path, 'width', p.width, 'height', p.height)
               order by p.sort, p.created_at
             )
      from public.gallery_photos p
    ), '[]'::jsonb)
  );
end;
$$;
