-- Remove recipes that were dropped from the bundled catalog so the
-- Supabase `recipes` table stops returning them via the remote-sync
-- layer. After this runs, constants/recipes-remote.ts's defensive
-- DEPRECATED_NUMERIC_IDS / DEPRECATED_TITLES filter is redundant
-- (still safe to leave in place, but it'll be a no-op).
--
-- The DELETE is keyed on both the canonical id and the numeric_id
-- because rows that pre-date the slug-id migration use the numeric
-- form ('62', '64', ...) while newer slug rows use descriptive ids.
-- Keeping window-track-cleaner-paste — that's a SEPARATE recipe in
-- the curated_20 seed, with its own ingredients.
--
-- Apply order: this should run AFTER 20260428000002_seed_curated_20.sql.

delete from public.recipes
where id in (
        '62', '64', '91', '93',
        -- curated_20 entries removed in a follow-up
        'sugar-lip-scrub',
        'diy-fabric-softener'
      )
   or numeric_id in (62, 64, 91, 93);

-- Sanity guard: if any of those titles still exist with different
-- ids (e.g. a future re-seed creates new entries with the same names),
-- those will NOT be deleted by this migration. Run once and inspect:
--
--   select id, numeric_id, title from public.recipes
--   where title in ('Faucet Shine Spray', 'Window Track Cleaner',
--                   'Quick Sink Shine');
--
-- ...then add specific ids to the delete above if any survive.
