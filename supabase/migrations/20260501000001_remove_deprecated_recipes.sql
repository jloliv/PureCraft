-- Mirror of db/0004_remove_deprecated_recipes.sql for Supabase's
-- migration runner. See that file for context.

delete from public.recipes
where id in ('62', '64', '91', '93')
   or numeric_id in (62, 64, 91, 93);
