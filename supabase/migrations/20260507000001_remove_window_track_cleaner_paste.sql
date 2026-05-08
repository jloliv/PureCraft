-- Remove the 'Window Track Cleaner Paste' recipe from the curated catalog.
-- saved_recipes.recipe_id has on-delete-cascade so user references clear
-- automatically.

delete from public.recipes
where id = 'window-track-cleaner-paste'
   or title = 'Window Track Cleaner Paste';
