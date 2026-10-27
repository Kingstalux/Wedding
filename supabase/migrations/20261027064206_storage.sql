-- =============================================================================
-- Migration 5: file storage for photos and music
--
-- One bucket, "media", with folders hero/, word/, gallery/ and music/.
--
-- The bucket is "public": a file can be downloaded by anyone who has its
-- exact address. Addresses use random file names (e.g.
-- gallery/5f0c…e2.jpg) and are only handed out inside get_invitation, so
-- in practice only guests see them. Listing the bucket, and uploading,
-- replacing or deleting files, is for the couple only.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  15 * 1024 * 1024,   -- 15 MB per file (photos are compressed to ~400 KB first)
  array[
    'image/jpeg', 'image/png', 'image/webp',
    'audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/x-m4a', 'audio/ogg'
  ]
)
on conflict (id) do nothing;

create policy "couple can list media" on storage.objects
  for select to authenticated
  using (bucket_id = 'media' and public.is_admin());

create policy "couple can upload media" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and public.is_admin());

create policy "couple can replace media" on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and public.is_admin())
  with check (bucket_id = 'media' and public.is_admin());

create policy "couple can delete media" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and public.is_admin());
