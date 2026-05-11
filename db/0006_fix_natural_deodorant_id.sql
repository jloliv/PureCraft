-- Mirror of supabase/migrations/20260508000001_fix_natural_deodorant_id.sql
-- for the manual db/ runner. See that file for context.

delete from public.recipes
where title = 'Natural Deodorant Spray'
  and id <> 'natural-deodorant'
  and exists (
    select 1 from public.recipes c where c.id = 'natural-deodorant'
  );

update public.recipes
set id = 'natural-deodorant',
    updated_at = now()
where title = 'Natural Deodorant Spray'
  and id <> 'natural-deodorant';
