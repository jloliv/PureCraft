-- =============================================================================
-- PureCraft schema migration 0006
--
-- Guarantees a user_profiles row exists immediately after signup, even if
-- the app crashes before its first patchProfile() call or the user never
-- finishes onboarding. The app still upserts opportunistically — this
-- trigger is the safety net so we never have an auth.users row without a
-- matching public.user_profiles row.
--
-- SECURITY DEFINER runs as the table owner (postgres), bypassing the
-- "users insert own profile" RLS policy. search_path is locked to public
-- to prevent search-path hijacking.
--
-- Idempotent. Apply after 0002_profiles_saved_search.sql.
-- =============================================================================

begin;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill any existing auth.users rows that don't have a profile yet.
-- Safe to run repeatedly; on conflict do nothing skips existing rows.
insert into public.user_profiles (user_id)
select id from auth.users
on conflict (user_id) do nothing;

commit;
