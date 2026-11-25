-- The pass at the door: for a guest coming on one day only, that day's date
-- (from the schedule), so the door can say "Wednesday 23 December only".
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
    'only_day',   case
                    when r.attending and r.days = 'first'
                      then (select min(e.starts_at) from public.events e where e.visible)
                    when r.attending and r.days = 'second'
                      then (select max(e.starts_at) from public.events e where e.visible)
                  end,
    'table_no',   g.table_no,
    'checked_in', exists (select 1 from public.checkins c where c.guest_id = g.id)
  )
  from public.guests g
  left join public.rsvps r on r.guest_id = g.id
  where g.pass_code = upper(trim(p_code))
    and g.deleted_at is null;
$$;
