-- The site now shows a single photo: the landing photo.
-- The "This invitation is personal" page no longer shows the couple photo,
-- so its public function goes. settings.word_photo_path is kept (unused),
-- so no data is lost.
drop function if exists public.get_cover_photo();
