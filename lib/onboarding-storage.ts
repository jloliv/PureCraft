// Onboarding completion gate — persists across launches on web via
// localStorage. Native (iOS/Android) needs `@react-native-async-storage/
// async-storage` for true persistence; until that's installed we fall back
// to in-memory so the prototype doesn't crash and the splash gate still
// gates first-launch within a session.

const KEY = 'purecraft_onboarding_complete';

// In-memory fallback (resets when the JS context restarts on native).
let memoryComplete = false;

function getStorage(): Storage | null {
  try {
    const ls = (globalThis as { localStorage?: Storage }).localStorage;
    return ls ?? null;
  } catch {
    return null;
  }
}

export function isOnboardingComplete(): boolean {
  const ls = getStorage();
  if (ls) {
    try {
      return ls.getItem(KEY) === 'true';
    } catch {
      // ignore
    }
  }
  return memoryComplete;
}

export function setOnboardingComplete(v: boolean = true): void {
  memoryComplete = v;
  const ls = getStorage();
  if (ls) {
    try {
      if (v) ls.setItem(KEY, 'true');
      else ls.removeItem(KEY);
    } catch {
      // ignore
    }
  }
}
