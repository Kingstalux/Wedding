-- =============================================================================
-- Gift list: several guests can reserve the same gift. Each guest reserves a
-- gift once; guests see how many have reserved it, never who. The couple sees
-- every reservation.
-- =============================================================================

alter table public.gift_reservations drop constraint gift_reservations_pkey;
alter table public.gift_reservations add primary key (gift_id, guest_id);
-- The primary key starts with gift_id, so it also serves lookups by gift.


-- The gift list for one guest: each gift, how many guests reserved it, and
-- whether this guest did. Never who. Not counted as a visit.
create or replace function public.get_registry(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  g public.guests := private.guest_for_token(p_token);
begin
  if g.id is null then
    raise exception 'invalid_token';
  end if;
  return coalesce((
    select jsonb_agg(
             jsonb_build_object(
               'id', r.id,
               'title_en', r.title_en, 'title_fr', r.title_fr,
               'description_en', r.description_en, 'description_fr', r.description_fr,
               'category_en', r.category_en, 'category_fr', r.category_fr,
               'photo_path', r.photo_path,
               'count', (
                 select count(*)
                 from public.gift_reservations res
                 join public.guests who on who.id = res.guest_id
                 where res.gift_id = r.id and who.deleted_at is null
               ),
               'mine', exists (
                 select 1 from public.gift_reservations res
                 where res.gift_id = r.id and res.guest_id = g.id
               )
             )
             order by r.sort, r.created_at
           )
    from public.registry_gifts r
  ), '[]'::jsonb);
end;
$$;

-- Reserve a gift. Already this guest's: nothing to do. Others may hold it too.
create or replace function public.reserve_gift(p_token text, p_gift_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  g public.guests := private.guest_for_token(p_token);
begin
  if g.id is null then
    raise exception 'invalid_token';
  end if;
  if not exists (select 1 from public.registry_gifts where id = p_gift_id) then
    raise exception 'gift_not_found';
  end if;
  if exists (
    select 1 from public.gift_reservations where gift_id = p_gift_id and guest_id = g.id
  ) then
    return;
  end if;
  -- Nobody can block the whole list.
  if (select count(*) from public.gift_reservations where guest_id = g.id) >= 5 then
    raise exception 'too_many_gifts';
  end if;
  insert into public.gift_reservations (gift_id, guest_id) values (p_gift_id, g.id);
exception
  -- A double click: the first one already reserved it.
  when unique_violation then
    return;
end;
$$;
