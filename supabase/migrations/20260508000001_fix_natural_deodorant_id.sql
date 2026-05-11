-- Canonicalize the Natural Deodorant Spray recipe's id to
-- 'natural-deodorant' so it matches the asset key in
-- constants/recipeImages.ts and the seed in 20260428000002. If a
-- previous deploy wrote this row under a different slug (e.g.
-- 'natural-deodorant-spray'), the image lookup misses and the card
-- falls through to the beauty-skincare lotion-icon at runtime.
--
-- Idempotent: each statement is a no-op when the data is already
-- correct, so this is safe to push regardless of the current state.
-- saved_recipes.recipe_id has on-delete-cascade, so any user
-- references on a soon-to-be-deleted duplicate clear automatically.

-- 1) If a canonical row already exists, drop any non-canonical
--    duplicates that share the title. The seed run leaves the
--    canonical row in place; this prunes anything left over.
delete from public.recipes
where title = 'Natural Deodorant Spray'
  and id <> 'natural-deodorant'
  and exists (
    select 1 from public.recipes c where c.id = 'natural-deodorant'
  );

-- 2) Otherwise (only a non-canonical row exists), rename it. Doing
--    this AFTER step 1 means we never collide with the canonical id.
update public.recipes
set id = 'natural-deodorant',
    updated_at = now()
where title = 'Natural Deodorant Spray'
  and id <> 'natural-deodorant';
