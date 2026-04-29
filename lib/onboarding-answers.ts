// Onboarding answer buffer.
//
// The onboarding flow runs BEFORE the user creates an account, so we can't
// write directly to `user_profiles`. We buffer answers in
// AsyncStorage (native) or localStorage (web), then `flushOnboardingAnswers`
// merges them into `user_profiles` the moment the user signs in or signs up.
//
// useOnboardingAnswers() exposes the live buffer to screens — useful so the
// final Results screen can show the user's actual picks instead of demo prefs.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

import { patchProfile } from './profile';

const KEY = 'purecraft_onboarding_answers';

export type OnboardingAnswers = {
  intent_categories?: string[];
  household?: string[];
  avoidances?: string[];
  scent_preferences?: string[];
  priorities?: string[];
  skin_profile?: Record<string, unknown>;
  routine?: Record<string, unknown>;
  region?: string | null;
};

let cache: OnboardingAnswers = {};
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

// --- Storage abstraction (AsyncStorage on native, localStorage on web) ---

async function readRaw(): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return globalThis.localStorage?.getItem(KEY) ?? null;
    } catch {
      return null;
    }
  }
  try {
    return await AsyncStorage.getItem(KEY);
  } catch {
    return null;
  }
}

async function writeRaw(value: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      globalThis.localStorage?.setItem(KEY, value);
    } catch {
      // ignore
    }
    return;
  }
  try {
    await AsyncStorage.setItem(KEY, value);
  } catch {
    // ignore
  }
}

async function clearRaw(): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      globalThis.localStorage?.removeItem(KEY);
    } catch {
      // ignore
    }
    return;
  }
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

// Hydrate on module load
void (async () => {
  const raw = await readRaw();
  if (raw) {
    try {
      cache = JSON.parse(raw);
    } catch {
      cache = {};
    }
  }
  hydrated = true;
  emit();
})();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
function snapshot(): OnboardingAnswers {
  return cache;
}

export function useOnboardingAnswers(): OnboardingAnswers {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

export function getOnboardingAnswers(): OnboardingAnswers {
  return cache;
}

export function isOnboardingAnswersHydrated(): boolean {
  return hydrated;
}

// Patch + persist. Optimistic — UI updates immediately, write goes async.
export async function patchOnboardingAnswers(
  patch: Partial<OnboardingAnswers>,
): Promise<void> {
  cache = { ...cache, ...patch };
  emit();
  await writeRaw(JSON.stringify(cache));
}

export async function clearOnboardingAnswers(): Promise<void> {
  cache = {};
  emit();
  await clearRaw();
}

// Flush to user_profiles. Called after sign-in/sign-up. Returns the patched
// profile fields for caller convenience.
export async function flushOnboardingAnswers(): Promise<{
  flushed: OnboardingAnswers;
  error: string | null;
}> {
  const answers = { ...cache };
  if (Object.keys(answers).length === 0) {
    return { flushed: {}, error: null };
  }
  const { error } = await patchProfile(answers);
  if (error) return { flushed: answers, error };
  // Don't clear immediately — keep the local copy as a fallback for offline.
  // The next successful upsert overwrites it anyway.
  return { flushed: answers, error: null };
}
