-- =============================================================================
-- Fix: uploading a guest list from the studio failed with
-- "UPDATE requires a WHERE clause".
--
-- Supabase protects API requests with pg_safeupdate, which refuses any UPDATE
-- or DELETE without a WHERE (a guard against wiping a whole table by mistake).
-- import_guests matched rows with an UPDATE of its temporary table that had
-- no WHERE. It now says `where true` explicitly. Nothing else changes.
-- =============================================================================

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
     )
   where true;  -- every row; Supabase's API refuses an UPDATE without WHERE

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
    -- 1. Remove guests not in the file (before adding anyone new).
    if p_remove_missing then
      update public.guests g
         set deleted_at = now()
       where g.deleted_at is null
         and not exists (select 1 from pg_temp.import_rows i where i.guest_id = g.id);
    end if;

    -- 2. Add new guests.
    insert into public.guests (name, phone)
    select i.name, i.phone from pg_temp.import_rows i where i.guest_id is null order by i.row_number;

    -- 3. Update changed names/phones.
    update public.guests g
       set name  = i.name,
           phone = coalesce(i.phone, g.phone)
      from pg_temp.import_rows i
     where g.id = i.guest_id
       and (g.name <> i.name or g.phone is distinct from coalesce(i.phone, g.phone));
  end if;

  return summary;
end;
$$;
