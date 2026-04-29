// Account lifecycle helpers — currently just deletion.
//
// Calls the `delete-account` Edge Function which uses the service role to
// purge the auth.users row. CASCADE FKs wipe profile + saves + user recipes.

import { supabase } from './supabase';

export async function deleteAccount(): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Backend not configured' };
  const { data, error } = await supabase.functions.invoke<{
    ok?: boolean;
    error?: string;
  }>('delete-account', {});
  if (error) return { error: error.message };
  if (!data?.ok) return { error: data?.error ?? 'Unknown error' };
  // Force a sign-out to clear any cached session
  await supabase.auth.signOut();
  return { error: null };
}
