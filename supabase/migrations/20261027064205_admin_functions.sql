-- =============================================================================
-- Migration 4: tools for the couple's studio
--
-- Simple edits (a guest's name, hiding a wish, ticking "received") go straight
-- through the tables, allowed by the policies in migration 2. The functions
-- here are for jobs that need several steps done together, or numbers
-- computed in the database. Each one starts by checking is_admin().
-- =============================================================================


create function private.require_admin()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
end;
$$;


-- -----------------------------------------------------------------------------
-- guest_list: one row per guest with their reply and check-in, for the
-- studio's table. `security_invoker` makes the view obey the caller's RLS,
-- so only the couple sees anything.
-- -----------------------------------------------------------------------------
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
  r.diet,
  r.note,
  r.responded_at,
  (select max(c.checked_in_at) from public.checkins c where c.guest_id = g.id) as last_checked_in_at
from public.guests g
left join public.rsvps r on r.guest_id = g.id;


-- -----------------------------------------------------------------------------
-- import_guests: compare an uploaded list with the current guests.
--
-- p_rows: [{"name": "Ama Ngono", "phone": "237677123456"}, …]
--         (phones already normalised by the website; empty = no phone)
-- A row matches an existing guest by phone, or by name when it has no phone.
--
-- With p_apply = false it only returns a preview:
--   { "added": [...], "changed": [...], "missing": [...], "unchanged": 12 }
-- With p_apply = true it also saves, in one transaction: adds new guests,
-- updates changed names/phones, and, only if p_remove_missing, removes
-- guests who are not in the file. Replies are never lost: matched guests
-- keep their row, and removed guests can be restored for 60 days.
-- -----------------------------------------------------------------------------
create function public.import_guests(
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
    nullif(regexp_replace(coalesce(r ->> 'phone', ''), '\D', '', 'g'), '') as phone
  from jsonb_array_elements(p_rows) with ordinality as x(r, ord);

  if exists (select 1 from pg_temp.import_rows where name is null or length(name) not between 1 and 120) then
    raise exception 'invalid_name';
  end if;
  if exists (select 1 from pg_temp.import_rows where phone is not null and phone !~ '^[0-9]{8,15}$') then
    raise exception 'invalid_phone';
  end if;

  -- Match each row to an active guest.
  alter table pg_temp.import_rows add column guest_id uuid;
  update pg_temp.import_rows i
     set guest_id = (
       select g.id
       from public.guests g
       where g.deleted_at is null
         and (
           (i.phone is not null and g.phone = i.phone)
           or (i.phone is null and lower(g.name) = lower(i.name))
         )
       order by g.created_at
       limit 1
     );

  select jsonb_build_object(
    'added', coalesce((
      select jsonb_agg(jsonb_build_object('name', i.name, 'phone', i.phone) order by i.row_number)
      from pg_temp.import_rows i where i.guest_id is null
    ), '[]'::jsonb),
    'changed', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', g.id, 'name', i.name, 'old_name', g.name,
               'phone', i.phone, 'old_phone', g.phone) order by i.row_number)
      from pg_temp.import_rows i
      join public.guests g on g.id = i.guest_id
      where g.name <> i.name or g.phone is distinct from coalesce(i.phone, g.phone)
    ), '[]'::jsonb),
    'missing', coalesce((
      select jsonb_agg(jsonb_build_object('id', g.id, 'name', g.name, 'phone', g.phone) order by g.name)
      from public.guests g
      where g.deleted_at is null
        and not exists (select 1 from pg_temp.import_rows i where i.guest_id = g.id)
    ), '[]'::jsonb),
    'unchanged', (
      select count(*)
      from pg_temp.import_rows i
      join public.guests g on g.id = i.guest_id
      where g.name = i.name and g.phone is not distinct from coalesce(i.phone, g.phone)
    )
  ) into summary;

  if p_apply then
    insert into public.guests (name, phone)
    select i.name, i.phone from pg_temp.import_rows i where i.guest_id is null order by i.row_number;

    update public.guests g
       set name  = i.name,
           phone = coalesce(i.phone, g.phone)
      from pg_temp.import_rows i
     where g.id = i.guest_id
       and (g.name <> i.name or g.phone is distinct from coalesce(i.phone, g.phone));

    if p_remove_missing then
      update public.guests g
         set deleted_at = now()
       where g.deleted_at is null
         and not exists (select 1 from pg_temp.import_rows i where i.guest_id = g.id);
    end if;
  end if;

  return summary;
end;
$$;


-- -----------------------------------------------------------------------------
-- Small guest-list actions
-- -----------------------------------------------------------------------------

-- Called when the couple clicks a guest's WhatsApp button.
create function public.mark_invite_sent(p_guest_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_admin();
  update public.guests set invite_sent_at = now() where id = p_guest_id;
end;
$$;

-- A fresh private link; the old one stops working immediately.
create function public.regenerate_token(p_guest_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_token text;
begin
  perform private.require_admin();
  update public.guests
     set token = private.new_token()
   where id = p_guest_id
  returning token into new_token;
  if new_token is null then
    raise exception 'guest_not_found';
  end if;
  return new_token;
end;
$$;

-- Bring back a guest removed in the last 60 days, with their reply.
create function public.restore_guest(p_guest_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_admin();
  update public.guests
     set deleted_at = null
   where id = p_guest_id
     and deleted_at > now() - interval '60 days';
  return found;
end;
$$;


-- -----------------------------------------------------------------------------
-- check_in: the door scanner.
-- Returns {status, name, checked_in_at, replied} where status is one of:
--   ok        checked in now
--   already   was already checked in for this event (shows when)
--   declined  replied "no"; NOT checked in, the door team decides
--   not_found no active guest has this code
-- A guest who never replied is still checked in (status ok, replied false).
-- -----------------------------------------------------------------------------
create function public.check_in(p_code text, p_event_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  g public.guests;
  reply boolean;
  existing timestamptz;
begin
  perform private.require_admin();

  select * into g from public.guests
   where pass_code = upper(trim(p_code)) and deleted_at is null;
  if g.id is null then
    return jsonb_build_object('status', 'not_found');
  end if;

  select attending into reply from public.rsvps where guest_id = g.id;

  select checked_in_at into existing from public.checkins
   where guest_id = g.id and event_id = p_event_id;
  if existing is not null then
    return jsonb_build_object('status', 'already', 'name', g.name,
                              'checked_in_at', existing, 'replied', reply is not null);
  end if;

  if reply is false then
    return jsonb_build_object('status', 'declined', 'name', g.name, 'replied', true);
  end if;

  insert into public.checkins (guest_id, event_id) values (g.id, p_event_id)
  returning checked_in_at into existing;

  return jsonb_build_object('status', 'ok', 'name', g.name,
                            'checked_in_at', existing, 'replied', reply is not null);
end;
$$;


-- -----------------------------------------------------------------------------
-- dashboard_stats: the figures at the top of "Overview & guests".
-- -----------------------------------------------------------------------------
create function public.dashboard_stats()
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
      'wishes',     (select count(*) from public.wishes),
      'gifts',      (select count(*) from public.gift_announcements)
    )
    from public.guests g
    left join public.rsvps r on r.guest_id = g.id
    where g.deleted_at is null
  );
end;
$$;


-- Studio functions: signed-in accounts only (and is_admin() inside).
revoke execute on function
  public.import_guests(jsonb, boolean, boolean),
  public.mark_invite_sent(uuid),
  public.regenerate_token(uuid),
  public.restore_guest(uuid),
  public.check_in(text, uuid),
  public.dashboard_stats(),
  private.require_admin()
from public, anon;

grant execute on function
  public.import_guests(jsonb, boolean, boolean),
  public.mark_invite_sent(uuid),
  public.regenerate_token(uuid),
  public.restore_guest(uuid),
  public.check_in(text, uuid),
  public.dashboard_stats()
to authenticated;
