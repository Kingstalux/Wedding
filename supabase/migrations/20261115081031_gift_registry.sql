-- =============================================================================
-- Gift list: things the couple would love. Guests reserve the gifts they plan
-- to bring (one guest per gift); others only see that a gift is taken, never
-- by whom. The couple manages the list and sees who reserved what.
-- Also: the couple can show MoMo, Orange Money or both.
-- =============================================================================

alter table public.settings
  add column show_momo boolean not null default true,
  add column show_om   boolean not null default true;

create table public.registry_gifts (
  id             uuid primary key default gen_random_uuid(),
  title_en       text not null check (length(trim(title_en)) between 1 and 120),
  title_fr       text not null default '' check (length(title_fr) <= 120),
  description_en text not null default '' check (length(description_en) <= 400),
  description_fr text not null default '' check (length(description_fr) <= 400),
  category_en    text not null default '' check (length(category_en) <= 40),
  category_fr    text not null default '' check (length(category_fr) <= 40),
  photo_path     text,
  sort           int not null default 0,
  created_at     timestamptz not null default now()
);

-- One reservation per gift: the gift is the key.
create table public.gift_reservations (
  gift_id    uuid primary key references public.registry_gifts (id) on delete cascade,
  guest_id   uuid not null references public.guests (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index gift_reservations_guest_idx on public.gift_reservations (guest_id);

alter table public.registry_gifts    enable row level security;
alter table public.gift_reservations enable row level security;
create policy "couple manages the gift list" on public.registry_gifts
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "couple manages gift reservations" on public.gift_reservations
  for all to authenticated using (public.is_admin()) with check (public.is_admin());


-- The gift list for one guest: each gift, whether it is taken, and whether
-- this guest took it. Never who else did. Not counted as a visit.
create function public.get_registry(p_token text)
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
               'reserved', res.gift_id is not null,
               'mine', coalesce(res.guest_id = g.id, false)
             )
             order by r.sort, r.created_at
           )
    from public.registry_gifts r
    left join public.gift_reservations res on res.gift_id = r.id
  ), '[]'::jsonb);
end;
$$;

-- Reserve a gift. Already this guest's: nothing to do. Someone else's: refused.
create function public.reserve_gift(p_token text, p_gift_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  g public.guests := private.guest_for_token(p_token);
  holder uuid;
begin
  if g.id is null then
    raise exception 'invalid_token';
  end if;
  if not exists (select 1 from public.registry_gifts where id = p_gift_id) then
    raise exception 'gift_not_found';
  end if;
  select guest_id into holder from public.gift_reservations where gift_id = p_gift_id;
  if holder = g.id then
    return;
  end if;
  if holder is not null then
    raise exception 'already_reserved';
  end if;
  -- Nobody can block the whole list.
  if (select count(*) from public.gift_reservations where guest_id = g.id) >= 5 then
    raise exception 'too_many_gifts';
  end if;
  insert into public.gift_reservations (gift_id, guest_id) values (p_gift_id, g.id);
exception
  -- Two guests in the same second: the second one finds it taken.
  when unique_violation then
    raise exception 'already_reserved';
end;
$$;

-- Give back a gift this guest reserved.
create function public.cancel_gift_reservation(p_token text, p_gift_id uuid)
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
  delete from public.gift_reservations where gift_id = p_gift_id and guest_id = g.id;
end;
$$;

grant execute on function
  public.get_registry(text),
  public.reserve_gift(text, uuid),
  public.cancel_gift_reservation(text, uuid)
to anon, authenticated;


-- The invitation says how many gifts are on the list.
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
