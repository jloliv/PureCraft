-- Mirror of supabase/migrations/20260507000001_remove_window_track_cleaner_paste.sql
-- for the manual db/ runner. See that file for context.

delete from public.recipes
where id = 'window-track-cleaner-paste'
   or title = 'Window Track Cleaner Paste';
