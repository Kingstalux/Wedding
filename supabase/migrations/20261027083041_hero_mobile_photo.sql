-- =============================================================================
-- Optional phone version of the landing photo.
--
-- The landing photo is landscape (16:9); on a phone held upright only a narrow
-- middle strip shows. The couple can now upload a separate upright photo (or
-- re-crop the same one) for phones. When it's empty, phones use the normal one.
--
-- get_invitation returns every settings column (minus a few), so guests
-- receive hero_mobile_path without changing that function.
-- =============================================================================

alter table public.settings add column hero_mobile_path text;
