-- =============================================================================
-- 0004 — Pantry Magic flag on recipes
--
-- A first-class boolean indicating whether a recipe is curated as a
-- "Pantry Magic" pick (uses common pantry ingredients, fast prep, ideal
-- for the Pantry Magic landing screen). The Pantry Magic screen already
-- derives instant matches from the user's pantry contents — this flag lets
-- editors *promote* particular recipes regardless of pantry overlap.
-- =============================================================================

begin;

alter table public.recipes
  add column if not exists pantry_magic boolean not null default false;

create index if not exists recipes_pantry_magic_idx
  on public.recipes (pantry_magic)
  where pantry_magic = true;

commit;
