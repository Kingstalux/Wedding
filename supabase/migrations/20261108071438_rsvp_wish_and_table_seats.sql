-- =============================================================================
-- 1. The RSVP's "note for the couple" is now a wish: it is posted to the
--    guest book (Words of love) in the same step as the reply. The separate
--    wish form and the dietary notes are gone.
-- 2. Seats per table: the couple can give one table its own number of seats;
--    the others use the default (settings.table_capacity).
-- =============================================================================


-- 1 ---------------------------------------------------------------------------
-- Replies without diet or note
-- -----------------------------------------------------------------------------
drop view public.guest_list;

alter table public.rsvps
  drop column diet,
  drop column note;

create view public.guest_list
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
  g.table_locked
from public.guests g
left join public.rsvps r on r.guest_id = g.id;

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
      select jsonb_build_object('attending', r.attending)
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


-- The reply, and the guest's wish if they wrote one. The wish is checked
-- first, so a refused wish (a link, too many) never leaves a half-saved reply.
drop function public.submit_rsvp(text, boolean, text, text);
drop function public.post_wish(text, text);

create function public.submit_rsvp(
  p_token     text,
  p_attending boolean,
  p_wish      text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  g public.guests := private.guest_for_token(p_token);
  msg text := trim(coalesce(p_wish, ''));
  result public.rsvps;
  wish public.wishes;
begin
  if g.id is null then
    raise exception 'invalid_token';
  end if;
  if p_attending is null then
    raise exception 'answer_required';
  end if;
  if now() > (select countdown_at from public.settings) then
    raise exception 'rsvp_closed';
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

  insert into public.rsvps as r (guest_id, attending)
  values (g.id, p_attending)
  on conflict (guest_id) do update
    set attending    = excluded.attending,
        responded_at = now()
  returning r.* into result;

  if msg <> '' then
    insert into public.wishes (guest_id, message)
    values (g.id, msg)
    returning * into wish;
  end if;

  return jsonb_build_object(
    'attending', result.attending,
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

grant execute on function public.submit_rsvp(text, boolean, text) to anon, authenticated;


-- 2 ---------------------------------------------------------------------------
-- Seats per table
-- -----------------------------------------------------------------------------
create table public.table_seats (
  table_no int primary key check (table_no >= 1),
  seats    int not null check (seats between 1 and 30)
);

alter table public.table_seats enable row level security;
create policy "couple manages table seats" on public.table_seats
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- A table's seats: its own number, or the default.
create function private.capacity(p_table int)
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select t.seats from public.table_seats t where t.table_no = p_table),
                  (select s.table_capacity from public.settings s limit 1));
$$;

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
  if not exists (select 1 from public.rsvps r where r.guest_id = g.id and r.attending) then
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

create or replace function private.check_table(p_table int)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_table is null then
    return;
  end if;
  if p_table > (select table_count from public.settings limit 1) then
    raise exception 'no_such_table';
  end if;
  if private.used_seats(p_table) > private.capacity(p_table) then
    raise exception 'table_full';
  end if;
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

-- Settings: fewer tables or seats than are in use is refused. A table with its
-- own number of seats isn't affected by the default.
create or replace function private.settings_seating()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.table_count < old.table_count or new.table_capacity < old.table_capacity then
    perform private.lock_seating();
    if exists (select 1 from public.guests where table_no > new.table_count and deleted_at is null)
       or exists (select 1 from public.reservations where table_no > new.table_count)
       or exists (select 1 from generate_series(1, new.table_count) t
                   where private.used_seats(t) > coalesce(
                     (select ts.seats from public.table_seats ts where ts.table_no = t),
                     new.table_capacity)) then
      raise exception 'tables_in_use';
    end if;
  end if;
  return new;
end;
$$;

-- Settings, after the change: forget the seats of tables that no longer
-- exist; seat the waiting guests when there is more room.
create function private.settings_after_seating()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.table_count < old.table_count then
    delete from public.table_seats where table_no > new.table_count;
  end if;
  if new.table_count > old.table_count or new.table_capacity > old.table_capacity then
    perform private.seat_all_waiting();
  end if;
  return null;
end;
$$;

create trigger settings_after_seating
  after update of table_count, table_capacity on public.settings
  for each row execute function private.settings_after_seating();

-- One table's seats: it must exist and hold everyone already there; more
-- room seats the waiting guests.
create function private.table_seats_check()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  t int := coalesce(new.table_no, old.table_no);
begin
  perform private.lock_seating();
  if tg_op = 'UPDATE' and new.table_no <> old.table_no then
    raise exception 'no_such_table';
  end if;
  if t > (select table_count from public.settings limit 1) then
    if tg_op = 'DELETE' then
      return null;
    end if;
    raise exception 'no_such_table';
  end if;
  if private.used_seats(t) > private.capacity(t) then
    raise exception 'tables_in_use';
  end if;
  perform private.seat_all_waiting();
  return null;
end;
$$;

create trigger table_seats_check
  after insert or update or delete on public.table_seats
  for each row execute function private.table_seats_check();


-- 3 ---------------------------------------------------------------------------
-- Permissions
-- -----------------------------------------------------------------------------
revoke execute on function
  private.capacity(int),
  private.settings_after_seating(),
  private.table_seats_check()
from public, anon, authenticated;
