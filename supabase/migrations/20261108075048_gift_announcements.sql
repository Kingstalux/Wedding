-- =============================================================================
-- "Let us know" is back, inside the gift popup: after sending money by MoMo or
-- Orange Money (or planning cash at the reception), a guest can tell the
-- couple. Guests only *announce* a gift; the couple ticks "received" in the
-- studio after checking their account. Restored from the first schema.
-- =============================================================================

create type public.gift_method as enum ('momo', 'orange', 'cash');

create table public.gift_announcements (
  id          uuid primary key default gen_random_uuid(),
  guest_id    uuid not null references public.guests (id) on delete cascade,
  method      public.gift_method not null,
  amount_fcfa int check (amount_fcfa is null or amount_fcfa between 1 and 100000000),
  message     text not null default '' check (length(message) <= 300),
  received    boolean not null default false,
  created_at  timestamptz not null default now()
);

create index gift_announcements_guest_idx on public.gift_announcements (guest_id, created_at desc);

alter table public.gift_announcements enable row level security;
create policy "couple manages gift announcements" on public.gift_announcements
  for all to authenticated using (public.is_admin()) with check (public.is_admin());


create function public.announce_gift(
  p_token   text,
  p_method  public.gift_method,
  p_amount  int default null,
  p_message text default ''
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  g public.guests := private.guest_for_token(p_token);
  msg text := left(trim(coalesce(p_message, '')), 300);
begin
  if g.id is null then
    raise exception 'invalid_token';
  end if;
  if p_method is null then
    raise exception 'method_required';
  end if;
  if p_amount is not null and p_amount not between 1 and 100000000 then
    raise exception 'invalid_amount';
  end if;
  if private.contains_link(msg) then
    raise exception 'links_not_allowed';
  end if;
  if (select count(*) from public.gift_announcements
      where guest_id = g.id and created_at > now() - interval '1 day') >= 5 then
    raise exception 'rate_limited';
  end if;

  insert into public.gift_announcements (guest_id, method, amount_fcfa, message)
  values (g.id, p_method, p_amount, msg);
end;
$$;

grant execute on function public.announce_gift(text, public.gift_method, int, text) to anon, authenticated;


-- The studio's figures count the announced gifts again.
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
      'wishes',     (select count(*) from public.wishes),
      'gifts',      (select count(*) from public.gift_announcements)
    )
    from public.guests g
    left join public.rsvps r on r.guest_id = g.id
    where g.deleted_at is null
  );
end;
$$;
