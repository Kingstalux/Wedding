-- =============================================================================
-- submit_rsvp also returns the guest's table, so the invitation can show
-- "Your table" straight after they accept, without loading the page again
-- (which would count as another visit).
-- Seating itself happens in the rsvps trigger (previous migration).
-- =============================================================================

create or replace function public.submit_rsvp(
  p_token     text,
  p_attending boolean,
  p_diet      text default '',
  p_note      text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  g public.guests := private.guest_for_token(p_token);
  result public.rsvps;
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

  insert into public.rsvps as r (guest_id, attending, diet, note)
  values (
    g.id,
    p_attending,
    left(trim(coalesce(p_diet, '')), 200),
    left(trim(coalesce(p_note, '')), 500)
  )
  on conflict (guest_id) do update
    set attending    = excluded.attending,
        diet         = excluded.diet,
        note         = excluded.note,
        responded_at = now()
  returning r.* into result;

  return jsonb_build_object(
    'attending', result.attending,
    'diet', result.diet,
    'note', result.note,
    'table_no', (select table_no from public.guests where id = g.id)
  );
end;
$$;
