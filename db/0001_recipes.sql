-- =============================================================================
-- PureCraft schema migration 0001 — recipes + supporting tables
--
-- Apply this in Supabase SQL Editor BEFORE running any seed file.
-- Idempotent: safe to re-run (uses `if not exists` and `create or replace`).
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Canonical category keys — must match constants/recipe-categories.ts
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'recipe_category_key') then
    create type recipe_category_key as enum (
      'cleaning',
      'laundry',
      'beauty-skincare',
      'hair-care',
      'baby-family-safe',
      'home-air-freshening',
      'pet-safe',
      'garden-outdoor',
      'seasonal-holiday',
      'emergency-budget-hacks'
    );
  end if;
end$$;

create type recipe_difficulty as enum ('Easy', 'Medium', 'Hard');

-- -----------------------------------------------------------------------------
-- recipes — the launch catalog. One row per recipe.
-- -----------------------------------------------------------------------------
create table if not exists public.recipes (
  -- Numeric IDs from launch-recipes-v3.json. We use text so future
  -- string-id recipes (e.g. user-generated) live in the same table.
  id              text primary key,
  numeric_id      integer unique,                  -- nullable for user recipes
  title           text not null,
  category_label  text not null,                   -- "Beauty & Skincare" (display)
  category_key    recipe_category_key not null,    -- canonical filter key
  difficulty      recipe_difficulty not null default 'Easy',
  time_label      text not null,                   -- "5 min"
  ingredients     jsonb not null default '[]'::jsonb, -- string[]
  instructions    jsonb not null default '[]'::jsonb, -- string[]
  safe_for_kids   boolean not null default false,
  cost_savings    text,                            -- "$5 saved"
  tags            jsonb not null default '[]'::jsonb, -- string[]

  -- Author + provenance
  source          text not null default 'catalog', -- 'catalog' | 'user' | 'ai'
  author_user_id  uuid,                            -- null for catalog
  is_published    boolean not null default true,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists recipes_category_key_idx on public.recipes (category_key);
create index if not exists recipes_safe_for_kids_idx on public.recipes (safe_for_kids);
create index if not exists recipes_tags_gin_idx on public.recipes using gin (tags);

-- -----------------------------------------------------------------------------
-- recipe_benefits — hero data: bullets, bestFor, useFrequency, whyItWorks.
-- 1:1 with recipes (only ~30 rows for now). Recipes without a row fall back
-- to category-level defaults inside the app.
-- -----------------------------------------------------------------------------
create table if not exists public.recipe_benefits (
  recipe_id      text primary key references public.recipes (id) on delete cascade,
  benefits       jsonb not null default '[]'::jsonb, -- string[]
  best_for       jsonb not null default '[]'::jsonb, -- string[]
  use_frequency  text,
  why_it_works   text,
  updated_at     timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- recipe_shelf_life — duration, storage, badges, notes.
-- 1:1 with recipes. Same hero/fallback pattern as benefits.
-- -----------------------------------------------------------------------------
create type shelf_life_badge as enum (
  'Pantry Stable',
  'Refrigerate',
  'Use Quickly',
  'Shake Before Use',
  'Sensitive to Heat',
  'Keep Dry'
);

create table if not exists public.recipe_shelf_life (
  recipe_id   text primary key references public.recipes (id) on delete cascade,
  duration    text not null,
  storage     text not null,
  best_kept   text,
  notes       jsonb not null default '[]'::jsonb,    -- string[]
  badges      shelf_life_badge[] not null default '{}',
  updated_at  timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- retail_overrides — per-recipe retail anchors used by the savings engine.
-- Without a row, the engine falls back to category-level pricing.
-- -----------------------------------------------------------------------------
create table if not exists public.retail_overrides (
  recipe_id   text primary key references public.recipes (id) on delete cascade,
  low_usd     numeric(10,2) not null,
  high_usd    numeric(10,2) not null,
  label       text not null,
  updated_at  timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- ingredient_help — the education layer. Keyed by lowercase canonical name.
-- Decoupled from recipes; recipes match into this table via fuzzy ingredient
-- name matching in the app (see constants/ingredient-help.ts).
-- -----------------------------------------------------------------------------
create table if not exists public.ingredient_help (
  key                text primary key,             -- 'castile soap'
  title              text not null,                -- 'Castile Soap'
  what               text not null,
  where_to_find      jsonb not null default '[]'::jsonb,
  best_options       jsonb not null default '[]'::jsonb,
  tips               jsonb not null default '[]'::jsonb,
  substitutes        jsonb not null default '[]'::jsonb,
  regions            jsonb not null default '{}'::jsonb,  -- { PT: ['Continente'], ... }
  allergy_warnings   jsonb not null default '[]'::jsonb,
  why_it_works       text,
  video_url          text,
  updated_at         timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- updated_at trigger (shared across all tables that need it)
-- -----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end$$;

drop trigger if exists recipes_touch_updated on public.recipes;
create trigger recipes_touch_updated before update on public.recipes
  for each row execute function public.touch_updated_at();

drop trigger if exists recipe_benefits_touch_updated on public.recipe_benefits;
create trigger recipe_benefits_touch_updated before update on public.recipe_benefits
  for each row execute function public.touch_updated_at();

drop trigger if exists recipe_shelf_life_touch_updated on public.recipe_shelf_life;
create trigger recipe_shelf_life_touch_updated before update on public.recipe_shelf_life
  for each row execute function public.touch_updated_at();

drop trigger if exists retail_overrides_touch_updated on public.retail_overrides;
create trigger retail_overrides_touch_updated before update on public.retail_overrides
  for each row execute function public.touch_updated_at();

drop trigger if exists ingredient_help_touch_updated on public.ingredient_help;
create trigger ingredient_help_touch_updated before update on public.ingredient_help
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Row-Level Security
-- - Anyone (anon) can read published catalog data.
-- - Only service role can write catalog rows.
-- - User-created recipes can be inserted by authenticated users (later).
-- -----------------------------------------------------------------------------
alter table public.recipes           enable row level security;
alter table public.recipe_benefits   enable row level security;
alter table public.recipe_shelf_life enable row level security;
alter table public.retail_overrides  enable row level security;
alter table public.ingredient_help   enable row level security;

-- Anyone can read published recipes
drop policy if exists "recipes are publicly readable" on public.recipes;
create policy "recipes are publicly readable"
  on public.recipes for select
  using (is_published = true);

drop policy if exists "recipe_benefits are publicly readable" on public.recipe_benefits;
create policy "recipe_benefits are publicly readable"
  on public.recipe_benefits for select using (true);

drop policy if exists "recipe_shelf_life is publicly readable" on public.recipe_shelf_life;
create policy "recipe_shelf_life is publicly readable"
  on public.recipe_shelf_life for select using (true);

drop policy if exists "retail_overrides are publicly readable" on public.retail_overrides;
create policy "retail_overrides are publicly readable"
  on public.retail_overrides for select using (true);

drop policy if exists "ingredient_help is publicly readable" on public.ingredient_help;
create policy "ingredient_help is publicly readable"
  on public.ingredient_help for select using (true);

-- Service role bypasses RLS automatically — no policy needed for catalog writes.
-- When auth is added, this policy lets users insert their own recipes:
drop policy if exists "users insert their own recipes" on public.recipes;
create policy "users insert their own recipes"
  on public.recipes for insert
  with check (
    auth.uid() is not null
    and source = 'user'
    and author_user_id = auth.uid()
  );

drop policy if exists "users update their own recipes" on public.recipes;
create policy "users update their own recipes"
  on public.recipes for update
  using (auth.uid() = author_user_id and source = 'user')
  with check (auth.uid() = author_user_id and source = 'user');

drop policy if exists "users delete their own recipes" on public.recipes;
create policy "users delete their own recipes"
  on public.recipes for delete
  using (auth.uid() = author_user_id and source = 'user');
