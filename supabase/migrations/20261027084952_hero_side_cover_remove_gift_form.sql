-- =============================================================================
-- 1. Which side of the landing photo the names sit on (computers/tablets),
--    so they don't cover the couple's faces.
-- 2. get_cover_photo(): the ONE thing strangers may see — the couple photo on
--    the "This invitation is personal" page. No names, dates or places.
-- 3. The "Let us know" gift form is removed from the site, so the gift
--    announcements table, its function and its count in the studio go too.
-- =============================================================================

-- 1 ---------------------------------------------------------------------------
alter table public.settings
  add column hero_text_side text not null default 'left'
  check (hero_text_side in ('left', 'right'));

-- 2 ---------------------------------------------------------------------------
create function public.get_cover_photo()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select word_photo_path from public.settings;
$$;

grant execute on function public.get_cover_photo() to anon, authenticated;

-- 3 ---------------------------------------------------------------------------
drop function public.announce_gift(text, public.gift_method, int, text);
drop table public.gift_announcements;
drop type public.gift_method;

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
      'wishes',     (select count(*) from public.wishes)
    )
    from public.guests g
    left join public.rsvps r on r.guest_id = g.id
    where g.deleted_at is null
  );
end;
$$;
