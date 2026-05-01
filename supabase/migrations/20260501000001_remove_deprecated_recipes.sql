-- Mirror of db/0004_remove_deprecated_recipes.sql for Supabase's
-- migration runner. See that file for context.

delete from public.recipes
where id in (
        '62', '64', '91', '93',
        -- curated_20 entries removed in a follow-up
        'sugar-lip-scrub',
        'diy-fabric-softener'
      )
   or numeric_id in (62, 64, 91, 93);
