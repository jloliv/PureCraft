// Push notifications — registration + token persistence.
//
// To enable in production:
//   1. `npx expo install expo-notifications expo-device`
//   2. Add `expo-notifications` to plugins in app.json with your iOS APNs
//      and Android FCM credentials (Expo handles APNs for managed projects).
//   3. Call `registerForPushNotifications()` after sign-in.
//
// The push token is stored on the user's profile so a server-side scheduler
// (Edge Function + cron, or Postgres pg_cron) can target users by prefs.
//
// Without expo-notifications installed, every export is a safe no-op.

import { supabase } from './supabase';

let cachedToken: string | null = null;

export async function registerForPushNotifications(): Promise<string | null> {
  try {
    const Notifications = await import('expo-notifications');
    const Device = await import('expo-device');

    if (!Device.isDevice) {
      // Push notifications don't work in simulators.
      return null;
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let final = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      final = status;
    }
    if (final !== 'granted') return null;

    const { data: token } = await Notifications.getExpoPushTokenAsync();
    cachedToken = token;
    await persistToken(token);
    return token;
  } catch {
    // Package not installed or registration failed.
    return null;
  }
}

async function persistToken(token: string): Promise<void> {
  if (!supabase) return;
  const { data: s } = await supabase.auth.getSession();
  const userId = s.session?.user?.id;
  if (!userId) return;
  // Stash on user_profiles via a JSONB field. We use the `routine` column
  // since it's already JSONB and unstructured — for production scale move
  // this to a dedicated `device_tokens` table with one row per device.
  await supabase
    .from('user_profiles')
    .upsert(
      { user_id: userId, routine: { push_token: token } },
      { onConflict: 'user_id' },
    );
}

export function getCachedPushToken(): string | null {
  return cachedToken;
}
