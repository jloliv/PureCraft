// Supabase client. Reads two env vars at build time:
//   EXPO_PUBLIC_SUPABASE_URL       — e.g. https://xxxxx.supabase.co
//   EXPO_PUBLIC_SUPABASE_ANON_KEY  — the public anon key from Project Settings
//
// Both are public values (the anon key is rate-limited and gated by RLS)
// so they can ship in the bundle. Don't ever ship the service role key.
//
// Drop them in `.env` (or `.env.local`) at the project root. Expo picks them
// up automatically because of the `EXPO_PUBLIC_` prefix.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import type { Database } from './db-types';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigured = !!(url && anonKey);

if (!supabaseConfigured) {
  // Don't crash in dev if env vars aren't set — the app still has the
  // bundled JSON fallback in constants/recipes.ts.
  // eslint-disable-next-line no-console
  console.warn(
    '[supabase] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY are not set. ' +
      'Falling back to bundled recipe data.',
  );
}

// On native (iOS/Android) AsyncStorage gives us proper persistent session
// storage. On web, supabase-js falls back to its built-in localStorage
// adapter which RN-Web exposes — leaving `storage: undefined` here gets us
// that default behavior automatically.
const storage = Platform.OS === 'web' ? undefined : AsyncStorage;

export const supabase: SupabaseClient<Database> | null = supabaseConfigured
  ? createClient<Database>(url!, anonKey!, {
      auth: {
        storage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null;
