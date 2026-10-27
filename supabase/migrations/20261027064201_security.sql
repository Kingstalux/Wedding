-- =============================================================================
-- Migration 2: who may read and write what (Row Level Security policies)
--
-- The rules, in one sentence each:
--   • The couple (a signed-in account listed in `admins`) can do everything.
--   • Everyone else gets NOTHING from the tables directly, not even the
--     programme or the couple's names. Guests receive the wedding content
--     only through get_invitation(token) (next migration), so a stranger with
--     the public key learns nothing about the wedding.
--
-- A table with RLS on and no matching policy returns zero rows, and rejects
-- inserts/updates/deletes. Policies below only ever *grant* access.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- is_admin(): true when the current request comes from the couple's account.
--
-- auth.uid() is the signed-in user's id taken from their login token (JWT),
-- or null for anonymous visitors. `security definer` lets the function read
-- the `admins` table even though callers can't; `search_path = ''` stops
-- anyone from tricking it with look-alike tables in another schema.
-- -----------------------------------------------------------------------------
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins where user_id = (select auth.uid())
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;


-- -----------------------------------------------------------------------------
-- The couple: full access to every table.
-- `to authenticated` = only requests from a signed-in account are considered;
-- is_admin() then checks that account is the couple's.
-- -----------------------------------------------------------------------------
create policy "couple can read settings" on public.settings
  for select to authenticated using (public.is_admin());
create policy "couple can update settings" on public.settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
-- (No insert/delete policy on settings: there is always exactly one row.)

create policy "couple manages events" on public.events
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "couple manages gallery" on public.gallery_photos
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "couple manages guests" on public.guests
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "couple manages rsvps" on public.rsvps
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "couple manages checkins" on public.checkins
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "couple manages wishes" on public.wishes
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "couple manages gift announcements" on public.gift_announcements
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- A signed-in account may see whether it is itself an admin (used by the
-- studio to decide whether to let someone in). Admins are added by hand in
-- the dashboard or SQL editor, never from the website.
create policy "accounts can see their own admin row" on public.admins
  for select to authenticated using (user_id = (select auth.uid()));
