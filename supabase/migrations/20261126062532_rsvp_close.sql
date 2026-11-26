-- Replies can close after the "Please reply by" date.
--
-- settings.close_replies: when on, guests can no longer reply (accept, decline
-- or change their answer) once the reply-by day has ended, Cameroon time.
-- guests.late_reply: the couple lets one guest reply after that anyway.
-- Both default to off, so nothing changes until the couple switches it on.

alter table public.settings
  add column close_replies boolean not null default false;

alter table public.guests
  add column late_reply boolean not null default false;


-- Can this guest still reply? ---------------------------------------------------
-- No once the celebration has begun, or once the reply-by day has ended
-- (midnight after it, in Douala) while closing is on, unless the couple
-- allowed this guest a late reply.
create function private.replies_open(g public.guests)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not (
    now() > s.countdown_at
    or (
      s.close_replies
      and s.rsvp_deadline is not null
      and now() >= ((s.rsvp_deadline + 1)::timestamp at time zone 'Africa/Douala')
      and not coalesce(g.late_reply, false)
    )
  )
  from public.settings s
$$;

revoke execute on function private.replies_open(public.guests) from public, anon, authenticated;


-- The reply: refused once replies have closed ----------------------------------
create or replace function public.submit_rsvp(
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
  if not private.replies_open(g) then
    raise exception 'rsvp_expired';
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


-- The invitation says whether this guest can still reply ----------------------
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

    -- False once replies have closed for this guest.
    'rsvp_open', private.replies_open(g),

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


-- The studio's guest list: the late-reply flag at the end ----------------------
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
  r.days,
  g.late_reply
from public.guests g
left join public.rsvps r on r.guest_id = g.id;
