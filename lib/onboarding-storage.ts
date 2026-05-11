// Onboarding completion gate — persists across launches.
//   • Native (iOS/Android): AsyncStorage.
//   • Web: localStorage.
//
// The public reader is synchronous because the splash gate consumes it
// while deciding which route to push. To make that safe we hydrate the
// in-memory cache on module load and expose `onboardingHydrated` — a
// promise the splash awaits before reading. Without that wait, the
// first launch after install would always return `false` (cache empty
// until AsyncStorage round-trips back) and a returning user would be
// kicked back through onboarding every cold start.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const KEY = 'purecraft_onboarding_complete';

let memoryComplete = false;

function getWebStorage(): Storage | null {
  try {
    return (globalThis as { localStorage?: Storage }).localStorage ?? null;
  } catch {
    return null;
  }
}

// Resolves once the on-disk value has been read into memory. Callers
// that need correctness on cold start (notably the splash gate) await
// this before reading `isOnboardingComplete()`.
export const onboardingHydrated: Promise<void> = (async () => {
  if (Platform.OS === 'web') {
    const ls = getWebStorage();
    if (ls) {
      try {
        memoryComplete = ls.getItem(KEY) === 'true';
      } catch {
        // ignore
      }
    }
    return;
  }
  try {
    const v = await AsyncStorage.getItem(KEY);
    memoryComplete = v === 'true';
  } catch {
    // AsyncStorage failure — treat as not-complete. Worst case we route
    // the user through onboarding once, which is recoverable.
    memoryComplete = false;
  }
})();

export function isOnboardingComplete(): boolean {
  return memoryComplete;
}

export function setOnboardingComplete(v: boolean = true): void {
  memoryComplete = v;
  if (Platform.OS === 'web') {
    const ls = getWebStorage();
    if (ls) {
      try {
        if (v) ls.setItem(KEY, 'true');
        else ls.removeItem(KEY);
      } catch {
        // ignore
      }
    }
    return;
  }
  // Fire-and-forget on native — the in-memory write is the source of
  // truth for the rest of this session; AsyncStorage is just persistence
  // for the next cold start.
  void (async () => {
    try {
      if (v) await AsyncStorage.setItem(KEY, 'true');
      else await AsyncStorage.removeItem(KEY);
    } catch {
      // ignore
    }
  })();
}
