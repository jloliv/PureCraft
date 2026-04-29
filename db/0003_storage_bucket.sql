-- =============================================================================
-- 0003 — Storage bucket for user-uploaded recipe images
--
-- Creates a public-read bucket (`recipe-images`) and RLS policies so each
-- authenticated user can upload to a folder they own (folder name == auth.uid()).
-- All published recipe images are world-readable so anonymous category
-- browsing keeps working.
-- =============================================================================

begin;

-- Create the bucket if it doesn't already exist. `public = true` lets us
-- generate plain CDN URLs without signing.
insert into storage.buckets (id, name, public)
values ('recipe-images', 'recipe-images', true)
on conflict (id) do nothing;

-- Allow public read of any file in the bucket.
drop policy if exists "recipe-images public read" on storage.objects;
create policy "recipe-images public read"
  on storage.objects for select
  using (bucket_id = 'recipe-images');

-- Authenticated users can upload, but only into a folder whose name matches
-- their auth.uid() — prevents people stomping on each other's files.
drop policy if exists "users upload own recipe images" on storage.objects;
create policy "users upload own recipe images"
  on storage.objects for insert
  with check (
    bucket_id = 'recipe-images'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "users update own recipe images" on storage.objects;
create policy "users update own recipe images"
  on storage.objects for update
  using (
    bucket_id = 'recipe-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "users delete own recipe images" on storage.objects;
create policy "users delete own recipe images"
  on storage.objects for delete
  using (
    bucket_id = 'recipe-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Add an `image_url` column to recipes so user-generated entries can store
-- their CDN URL. (Catalog images are still served from the bundle.)
alter table public.recipes
  add column if not exists image_url text;

commit;
