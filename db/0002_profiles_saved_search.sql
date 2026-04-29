-- =============================================================================
-- PureCraft schema migration 0002
--
-- Adds:
--   1. user_profiles      — onboarding answers + per-user prefs
--   2. saved_recipes      — bookmarks / "Save" button persistence
--   3. recipes.search_tsv — full-text search vector + GIN index + RPC
--
-- Idempotent. Apply after 0001_recipes.sql.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. user_profiles — one row per auth user, created lazily on first upsert.
-- -----------------------------------------------------------------------------
create table if not exists public.user_profiles (
  user_id              uuid primary key references auth.users (id) on delete cascade,

  -- Onboarding intent (which categories they came in for)
  intent_categories    jsonb not null default '[]'::jsonb,   -- string[] (category keys)

  -- Household composition (matches household.tsx keys: baby, young, older, teens, pets, adults, elderly)
  household            jsonb not null default '[]'::jsonb,   -- string[]

  -- Things to avoid (allergens, fragrances, ingredients, …)
  avoidances           jsonb not null default '[]'::jsonb,   -- string[]

  -- Scent / sensitivity preferences
  scent_preferences    jsonb not null default '[]'::jsonb,   -- string[]

  -- Priorities (Save money, Avoid harsh chemicals, Pet safety, …)
  priorities           jsonb not null default '[]'::jsonb,   -- string[]

  -- Skin profile (sensitive, dry, …) — beauty-skincare personalization
  skin_profile         jsonb not null default '{}'::jsonb,

  -- Routine / time-of-day cadence (collected in onboarding/routine + onboarding/time)
  routine              jsonb not null default '{}'::jsonb,

  -- Region / locale (currency, store availability for ingredient_help)
  region               text,

  -- Onboarding state machine (which step they last completed)
  onboarding_step      integer not null default 0,
  onboarding_complete  boolean not null default false,

  -- Display name (from sign-up or settings)
  display_name         text,

  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

drop trigger if exists user_profiles_touch_updated on public.user_profiles;
create trigger user_profiles_touch_updated before update on public.user_profiles
  for each row execute function public.touch_updated_at();

alter table public.user_profiles enable row level security;

drop policy if exists "users read own profile" on public.user_profiles;
create policy "users read own profile"
  on public.user_profiles for select
  using (auth.uid() = user_id);

drop policy if exists "users insert own profile" on public.user_profiles;
create policy "users insert own profile"
  on public.user_profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "users update own profile" on public.user_profiles;
create policy "users update own profile"
  on public.user_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users delete own profile" on public.user_profiles;
create policy "users delete own profile"
  on public.user_profiles for delete
  using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 2. saved_recipes — bookmarks. Compound PK so Save/Unsave is idempotent.
-- -----------------------------------------------------------------------------
create table if not exists public.saved_recipes (
  user_id     uuid not null references auth.users (id) on delete cascade,
  recipe_id   text not null references public.recipes (id) on delete cascade,
  saved_at    timestamptz not null default now(),
  -- Optional per-save annotation: "tried this on the kids' bath day"
  note        text,
  -- How many times the user has marked this recipe as made (drives the
  -- "Saved Dashboard" madeCount + lastMade columns).
  made_count  integer not null default 0,
  last_made   timestamptz,

  primary key (user_id, recipe_id)
);

create index if not exists saved_recipes_user_idx on public.saved_recipes (user_id, saved_at desc);

alter table public.saved_recipes enable row level security;

drop policy if exists "users read own saves" on public.saved_recipes;
create policy "users read own saves"
  on public.saved_recipes for select
  using (auth.uid() = user_id);

drop policy if exists "users insert own saves" on public.saved_recipes;
create policy "users insert own saves"
  on public.saved_recipes for insert
  with check (auth.uid() = user_id);

drop policy if exists "users update own saves" on public.saved_recipes;
create policy "users update own saves"
  on public.saved_recipes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users delete own saves" on public.saved_recipes;
create policy "users delete own saves"
  on public.saved_recipes for delete
  using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 3. Full-text search on recipes.
--    A generated tsvector column over title + category_label + ingredients
--    (cast from jsonb to text). GIN index for sub-millisecond lookup.
-- -----------------------------------------------------------------------------
alter table public.recipes
  add column if not exists search_tsv tsvector
  generated always as (
    to_tsvector(
      'english',
      coalesce(title, '') || ' ' ||
      coalesce(category_label, '') || ' ' ||
      coalesce(ingredients::text, '') || ' ' ||
      coalesce(tags::text, '')
    )
  ) stored;

create index if not exists recipes_search_tsv_idx
  on public.recipes using gin (search_tsv);

-- RPC: full-text search with prefix matching for live "as you type" UX.
create or replace function public.search_recipes(q text, max_results int default 30)
returns setof public.recipes
language sql stable as $$
  select *
  from public.recipes
  where is_published = true
    and (
      q is null or q = ''
      or search_tsv @@ websearch_to_tsquery('english', q)
      -- prefix-match fallback so "lav" finds "lavender" before tsquery does
      or title ilike '%' || q || '%'
    )
  order by
    -- exact title match first, then ts_rank, then numeric id for stability
    case when title ilike q then 0 else 1 end,
    case when q is null or q = '' then 1
         else ts_rank(search_tsv, websearch_to_tsquery('english', q)) end desc,
    numeric_id asc nulls last
  limit max_results;
$$;

grant execute on function public.search_recipes(text, int) to anon, authenticated;

commit;
