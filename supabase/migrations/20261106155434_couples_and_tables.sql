-- =============================================================================
-- Couple invitations and table seating
--
-- 1. An invitation can be for a couple: a second name and, optionally, a
--    second WhatsApp number. A couple shares one reply, one pass and two seats.
-- 2. Tables: the couple sets how many tables and seats per table (30 × 10 to
--    start). A guest who accepts is seated automatically; a couple always at
--    the same table. The couple can move anyone and reserve seats for people
--    without an invitation (e.g. family).
--
-- The seating rules live here, in triggers, so they hold whatever makes the
-- change (a guest replying, the studio, an import): a table can never take
-- more people than it has seats.
-- =============================================================================


-- 1 ---------------------------------------------------------------------------
-- Couples
-- -----------------------------------------------------------------------------
alter table public.guests
  add column partner_name  text check (partner_name is null or length(trim(partner_name)) between 1 and 120),
  add column partner_phone text check (partner_phone is null or partner_phone ~ '^[0-9]{8,15}$'),
  add constraint guests_partner_phone_needs_name check (partner_phone is null or partner_name is not null);

create index guests_partner_phone_idx on public.guests (partner_phone) where partner_phone is not null;

-- WhatsApp wording for couples; empty = use the normal wording.
alter table public.settings
  add column wa_template_couple_en text not null default '',
  add column wa_template_couple_fr text not null default '';

-- How many people an invitation is for.
create function private.seats(p_partner_name text)
returns int
language sql
immutable
set search_path = ''
as $$
  select case when p_partner_name is null then 1 else 2 end;
$$;

-- First names only: "Kingsley" or "Kingsley & Vanessa".
create function private.short_names(p_name text, p_partner_name text)
returns text
language sql
immutable
set search_path = ''
as $$
  select split_part(trim(p_name), ' ', 1)
         || coalesce(' & ' || split_part(trim(p_partner_name), ' ', 1), '');
$$;

-- Full names: "Kingsley Ngu" or "Kingsley Ngu & Vanessa Ngu".
create function private.full_names(p_name text, p_partner_name text)
returns text
language sql
immutable
set search_path = ''
as $$
  select trim(p_name) || coalesce(' & ' || trim(p_partner_name), '');
$$;


-- 2 ---------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------
alter table public.settings
  add column table_count    int not null default 30 check (table_count between 1 and 100),
  add column table_capacity int not null default 10 check (table_capacity between 1 and 30),
  add column show_tables    boolean not null default true;

alter table public.guests
  add column table_no     int check (table_no is null or table_no >= 1),
  -- true when the couple placed the guest by hand
  add column table_locked boolean not null default false;

create index guests_table_idx on public.guests (table_no) where table_no is not null;

-- Seats held for people without an invitation ("Bride's family", 6 seats).
create table public.reservations (
  id         uuid primary key default gen_random_uuid(),
  label      text not null check (length(trim(label)) between 1 and 80),
  seats      int not null check (seats between 1 and 30),
  table_no   int not null check (table_no >= 1),
  note       text not null default '' check (length(note) <= 200),
  created_at timestamptz not null default now()
);

alter table public.reservations enable row level security;
create policy "couple manages reservations" on public.reservations
  for all to authenticated using (public.is_admin()) with check (public.is_admin());


-- Seats taken at a table: seated guests (1 or 2 each) plus reservations.
create function private.used_seats(p_table int)
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select sum(private.seats(g.partner_name))
                     from public.guests g
                    where g.table_no = p_table and g.deleted_at is null), 0)::int
       + coalesce((select sum(r.seats)
                     from public.reservations r
                    where r.table_no = p_table), 0)::int;
$$;

-- Every seating change waits its turn, so two guests accepting at the same
-- moment can't both take the last seat.
create function private.lock_seating()
returns void
language sql
volatile
set search_path = ''
as $$
  select pg_advisory_xact_lock(hashtext('wedding.seating'));
$$;

-- Seat one accepted guest automatically. Picks the table with the fewest free
-- seats that still fits the whole party (lowest number on a tie): tables fill
-- one after another, single guests fill the odd gaps, and tables with two or
-- more free seats stay open for couples. Returns the table, or null if none
-- has room (the guest then waits in the studio's list).
create function private.seat_guest(p_guest_id uuid)
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
   where s.table_capacity - private.used_seats(t) >= private.seats(g.partner_name)
   order by s.table_capacity - private.used_seats(t), t
   limit 1;

  if chosen is not null then
    update public.guests set table_no = chosen where id = g.id;
  end if;
  return chosen;
end;
$$;

-- Seat everyone who accepted but has no table yet, couples first.
create function private.seat_all_waiting()
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
      join public.rsvps r on r.guest_id = g.id and r.attending
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

-- Refuse a table that doesn't exist or that would go over its seats.
create function private.check_table(p_table int)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  s public.settings;
begin
  if p_table is null then
    return;
  end if;
  select * into s from public.settings limit 1;
  if p_table > s.table_count then
    raise exception 'no_such_table';
  end if;
  if private.used_seats(p_table) > s.table_capacity then
    raise exception 'table_full';
  end if;
end;
$$;


-- Guests: before a change.
--   * a removed guest gives up their seat;
--   * only a guest who accepted can be given a table;
--   * a seated single who becomes a couple (an extra seat) is moved if their
--     table has no room left: they lose the seat here and are seated again
--     after the change.
create function private.guests_before_seating()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  cap int;
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
    select table_capacity into cap from public.settings limit 1;
    if private.used_seats(new.table_no) + 1 > cap then
      new.table_no := null;
      new.table_locked := false;
    end if;
  end if;
  return new;
end;
$$;

-- Guests: after a change, check the table, or seat them again if needed
-- (restored, or moved off a full table by the rule above).
create function private.guests_after_seating()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.table_no is not null then
    perform private.lock_seating();
    perform private.check_table(new.table_no);
  elsif new.deleted_at is null
        and (old.deleted_at is not null
             or (old.table_no is not null and new.partner_name is distinct from old.partner_name)) then
    perform private.seat_guest(new.id);
  end if;
  return null;
end;
$$;

create trigger guests_before_seating
  before insert or update of table_no, partner_name, deleted_at on public.guests
  for each row execute function private.guests_before_seating();

create trigger guests_after_seating
  after update of table_no, partner_name, deleted_at on public.guests
  for each row execute function private.guests_after_seating();

-- Replies: accepting seats the guest; declining (or a removed reply) frees
-- the seat.
create function private.rsvps_seating()
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
  if new.attending then
    perform private.seat_guest(new.guest_id);
  else
    update public.guests set table_no = null where id = new.guest_id and table_no is not null;
  end if;
  return null;
end;
$$;

create trigger rsvps_seating
  after insert or update of attending or delete on public.rsvps
  for each row execute function private.rsvps_seating();

-- Reservations: same table checks.
create function private.reservations_seating()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.lock_seating();
  perform private.check_table(new.table_no);
  return null;
end;
$$;

create trigger reservations_seating
  after insert or update on public.reservations
  for each row execute function private.reservations_seating();

-- Settings: fewer tables or seats than are in use is refused.
create function private.settings_seating()
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
                   where private.used_seats(t) > new.table_capacity) then
      raise exception 'tables_in_use';
    end if;
  end if;
  return new;
end;
$$;

create trigger settings_seating
  before update of table_count, table_capacity on public.settings
  for each row execute function private.settings_seating();


-- Studio: place a guest by hand (null = back to the waiting list).
create function public.move_guest(p_guest_id uuid, p_table int)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_admin();
  update public.guests
     set table_no = p_table,
         table_locked = p_table is not null
   where id = p_guest_id and deleted_at is null;
  if not found then
    raise exception 'guest_not_found';
  end if;
end;
$$;

-- Studio: "Seat everyone waiting".
create function public.seat_waiting()
returns int
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_admin();
  return private.seat_all_waiting();
end;
$$;


-- 3 ---------------------------------------------------------------------------
-- Functions that show names, seats and tables
-- -----------------------------------------------------------------------------

-- New columns go at the end (a view can only grow that way).
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
  r.diet,
  r.note,
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
      select jsonb_build_object('attending', r.attending, 'diet', r.diet, 'note', r.note)
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

create or replace function public.post_wish(p_token text, p_message text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  g public.guests := private.guest_for_token(p_token);
  msg text := trim(coalesce(p_message, ''));
  result public.wishes;
begin
  if g.id is null then
    raise exception 'invalid_token';
  end if;
  if length(msg) not between 1 and 500 then
    raise exception 'message_length';
  end if;
  if private.contains_link(msg) then
    raise exception 'links_not_allowed';
  end if;
  if (select count(*) from public.wishes
      where guest_id = g.id and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'rate_limited';
  end if;

  insert into public.wishes (guest_id, message)
  values (g.id, msg)
  returning * into result;

  return jsonb_build_object(
    'id', result.id,
    'message', result.message,
    'created_at', result.created_at,
    'author', private.short_names(g.name, g.partner_name),
    'mine', true
  );
end;
$$;

-- What anyone scanning a pass's QR code may see: first names, how many
-- people, whether they're coming, their table, whether already checked in.
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
    'table_no',   g.table_no,
    'checked_in', exists (select 1 from public.checkins c where c.guest_id = g.id)
  )
  from public.guests g
  left join public.rsvps r on r.guest_id = g.id
  where g.pass_code = upper(trim(p_code))
    and g.deleted_at is null;
$$;

create or replace function public.check_in(p_code text, p_event_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  g public.guests;
  reply boolean;
  existing timestamptz;
  who jsonb;
begin
  perform private.require_admin();

  select * into g from public.guests
   where pass_code = upper(trim(p_code)) and deleted_at is null;
  if g.id is null then
    return jsonb_build_object('status', 'not_found');
  end if;

  who := jsonb_build_object('name', private.full_names(g.name, g.partner_name),
                            'seats', private.seats(g.partner_name),
                            'table_no', g.table_no);

  select attending into reply from public.rsvps where guest_id = g.id;

  select checked_in_at into existing from public.checkins
   where guest_id = g.id and event_id = p_event_id;
  if existing is not null then
    return who || jsonb_build_object('status', 'already',
                                     'checked_in_at', existing, 'replied', reply is not null);
  end if;

  if reply is false then
    return who || jsonb_build_object('status', 'declined', 'replied', true);
  end if;

  insert into public.checkins (guest_id, event_id) values (g.id, p_event_id)
  returning checked_in_at into existing;

  return who || jsonb_build_object('status', 'ok',
                                   'checked_in_at', existing, 'replied', reply is not null);
end;
$$;

-- Invitation counts as before, plus people (a couple counts as two) and seats.
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
      'checked_in_people', coalesce(sum(private.seats(g.partner_name)) filter (where exists (
                             select 1 from public.checkins c where c.guest_id = g.id)), 0),
      'wishes',     (select count(*) from public.wishes)
    )
    from public.guests g
    left join public.rsvps r on r.guest_id = g.id
    where g.deleted_at is null
  );
end;
$$;


-- -----------------------------------------------------------------------------
-- import_guests: now with optional partner name / partner phone per row.
--
-- p_rows: [{"name": "Kingsley Ngu", "phone": "237677123456",
--           "partner_name": "Vanessa Ngu", "partner_phone": ""}, …]
-- "partner_name" is only sent when the file has that column: a file without
-- it leaves existing couples as they are; a file with it (even empty for a
-- row) sets it.
-- A row matches an active guest when one of its numbers is one of the guest's
-- numbers, or by name when the row has no number at all.
-- -----------------------------------------------------------------------------
create or replace function public.import_guests(
  p_rows           jsonb,
  p_apply          boolean default false,
  p_remove_missing boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  summary jsonb;
begin
  perform private.require_admin();

  if jsonb_typeof(p_rows) is distinct from 'array' then
    raise exception 'rows_must_be_array';
  end if;

  create temp table pg_temp.import_rows on commit drop as
  select
    ord::int as row_number,
    trim(r ->> 'name') as name,
    nullif(regexp_replace(coalesce(r ->> 'phone', ''), '\D', '', 'g'), '') as phone,
    r ? 'partner_name' as partner_given,
    nullif(trim(coalesce(r ->> 'partner_name', '')), '') as partner_name,
    nullif(regexp_replace(coalesce(r ->> 'partner_phone', ''), '\D', '', 'g'), '') as partner_phone
  from jsonb_array_elements(p_rows) with ordinality as x(r, ord);

  if exists (select 1 from pg_temp.import_rows where name is null or length(name) not between 1 and 120) then
    raise exception 'invalid_name';
  end if;
  if exists (select 1 from pg_temp.import_rows where length(partner_name) > 120) then
    raise exception 'invalid_name';
  end if;
  if exists (select 1 from pg_temp.import_rows
             where (phone is not null and phone !~ '^[0-9]{8,15}$')
                or (partner_phone is not null and partner_phone !~ '^[0-9]{8,15}$')) then
    raise exception 'invalid_phone';
  end if;
  if exists (select 1 from pg_temp.import_rows where partner_phone is not null and partner_name is null) then
    raise exception 'partner_phone_without_name';
  end if;

  -- Match each row to an active guest.
  alter table pg_temp.import_rows add column guest_id uuid;
  update pg_temp.import_rows i
     set guest_id = (
       select g.id
       from public.guests g
       where g.deleted_at is null
         and (
           (i.phone is not null and i.phone in (g.phone, g.partner_phone))
           or (i.partner_phone is not null and i.partner_phone in (g.phone, g.partner_phone))
           or (i.phone is null and i.partner_phone is null and lower(g.name) = lower(i.name))
         )
       order by g.created_at
       limit 1
     )
   where true;  -- every row; Supabase's API refuses an UPDATE without WHERE

  -- What each matched guest would become.
  alter table pg_temp.import_rows
    add column new_phone text,
    add column new_partner_name text,
    add column new_partner_phone text;
  update pg_temp.import_rows i
     set new_phone         = coalesce(i.phone, g.phone),
         new_partner_name  = case when i.partner_given then i.partner_name else g.partner_name end
    from public.guests g
   where g.id = i.guest_id;
  update pg_temp.import_rows i
     set new_partner_phone = case
           when i.new_partner_name is null then null
           else coalesce(i.partner_phone, (select g.partner_phone from public.guests g where g.id = i.guest_id))
         end
   where i.guest_id is not null;

  select jsonb_build_object(
    'added', coalesce((
      select jsonb_agg(jsonb_build_object('name', i.name, 'phone', i.phone,
                                          'partner_name', i.partner_name,
                                          'partner_phone', i.partner_phone) order by i.row_number)
      from pg_temp.import_rows i where i.guest_id is null
    ), '[]'::jsonb),
    'changed', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', g.id, 'name', i.name, 'old_name', g.name,
               'phone', i.new_phone, 'old_phone', g.phone,
               'partner_name', i.new_partner_name, 'old_partner_name', g.partner_name,
               'partner_phone', i.new_partner_phone, 'old_partner_phone', g.partner_phone)
             order by i.row_number)
      from pg_temp.import_rows i
      join public.guests g on g.id = i.guest_id
      where g.name <> i.name
         or g.phone is distinct from i.new_phone
         or g.partner_name is distinct from i.new_partner_name
         or g.partner_phone is distinct from i.new_partner_phone
    ), '[]'::jsonb),
    'missing', coalesce((
      select jsonb_agg(jsonb_build_object('id', g.id, 'name', g.name, 'phone', g.phone,
                                          'partner_name', g.partner_name) order by g.name)
      from public.guests g
      where g.deleted_at is null
        and not exists (select 1 from pg_temp.import_rows i where i.guest_id = g.id)
    ), '[]'::jsonb),
    'unchanged', (
      select count(*)
      from pg_temp.import_rows i
      join public.guests g on g.id = i.guest_id
      where g.name = i.name
        and g.phone is not distinct from i.new_phone
        and g.partner_name is not distinct from i.new_partner_name
        and g.partner_phone is not distinct from i.new_partner_phone
    )
  ) into summary;

  if p_apply then
    -- 1. Remove guests not in the file (before adding anyone new).
    if p_remove_missing then
      update public.guests g
         set deleted_at = now()
       where g.deleted_at is null
         and not exists (select 1 from pg_temp.import_rows i where i.guest_id = g.id);
    end if;

    -- 2. Add new guests.
    insert into public.guests (name, phone, partner_name, partner_phone)
    select i.name, i.phone, i.partner_name, i.partner_phone
      from pg_temp.import_rows i
     where i.guest_id is null
     order by i.row_number;

    -- 3. Update changed guests.
    update public.guests g
       set name          = i.name,
           phone         = i.new_phone,
           partner_name  = i.new_partner_name,
           partner_phone = i.new_partner_phone
      from pg_temp.import_rows i
     where g.id = i.guest_id
       and (g.name <> i.name
            or g.phone is distinct from i.new_phone
            or g.partner_name is distinct from i.new_partner_name
            or g.partner_phone is distinct from i.new_partner_phone);
  end if;

  return summary;
end;
$$;


-- 4 ---------------------------------------------------------------------------
-- Permissions
-- -----------------------------------------------------------------------------
revoke execute on function
  private.seats(text),
  private.short_names(text, text),
  private.full_names(text, text),
  private.used_seats(int),
  private.lock_seating(),
  private.seat_guest(uuid),
  private.seat_all_waiting(),
  private.check_table(int),
  private.guests_before_seating(),
  private.guests_after_seating(),
  private.rsvps_seating(),
  private.reservations_seating(),
  private.settings_seating()
from public, anon, authenticated;

-- The guest_list view (read by the signed-in studio) shows seats.
grant execute on function private.seats(text) to authenticated;

revoke execute on function public.move_guest(uuid, int), public.seat_waiting() from public, anon;
grant execute on function public.move_guest(uuid, int), public.seat_waiting() to authenticated;


-- 5 ---------------------------------------------------------------------------
-- Seat everyone who has already accepted.
-- -----------------------------------------------------------------------------
select private.seat_all_waiting();
