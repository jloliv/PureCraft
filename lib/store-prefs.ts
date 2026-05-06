// Preferred-shopping-store preferences — local-only, no backend dependency.
//
// The user picks up to 3 stores in /store-preferences. The shopping-list
// footer reads them via useStorePrefs() to decide whether to render an
// instant action (1 store), a drop-up selector (2+), or the "no store
// configured" fallback with print + setup options (0).
//
// Storage strategy mirrors lib/onboarding-storage.ts: AsyncStorage on
// native, localStorage on web, in-memory if neither is available. We
// don't ship this through Supabase because the cleanest UX is local —
// "where do I shop" is a device-level preference, not an account one,
// and avoids gating the feature on auth.

import { useEffect, useSyncExternalStore } from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'purecraft_preferred_stores';
const MAX_STORES = 3;

export type StoreKey = 'walmart' | 'target' | 'amazon' | 'instacart';

export type StoreOption = {
  key: StoreKey;
  label: string;
  /** Short tagline shown under the label in the picker. */
  tagline: string;
};

// Single source of truth for the supported stores. Adding a new store is
// a 1-line change here + a new case in lib/store-actions.ts buildStoreUrl.
export const STORE_OPTIONS: readonly StoreOption[] = [
  { key: 'walmart', label: 'Walmart', tagline: 'Pick up or ship to home' },
  { key: 'target', label: 'Target', tagline: 'In-store or drive-up' },
  { key: 'amazon', label: 'Amazon', tagline: 'Ships in 1–2 days' },
  { key: 'instacart', label: 'Instacart', tagline: 'Same-day delivery' },
] as const;

const STORE_KEYS = STORE_OPTIONS.map((s) => s.key);

function isStoreKey(value: unknown): value is StoreKey {
  return typeof value === 'string' && (STORE_KEYS as string[]).includes(value);
}

// In-memory store (single source of truth for subscribers).
let stores: StoreKey[] = [];
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function parse(raw: string | null): StoreKey[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Filter to known keys + dedupe + cap at MAX_STORES so a corrupted
    // value can't violate invariants the UI assumes.
    const seen = new Set<StoreKey>();
    const out: StoreKey[] = [];
    for (const v of parsed) {
      if (isStoreKey(v) && !seen.has(v)) {
        seen.add(v);
        out.push(v);
        if (out.length >= MAX_STORES) break;
      }
    }
    return out;
  } catch {
    return [];
  }
}

async function hydrate(): Promise<void> {
  if (hydrated) return;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    stores = parse(raw);
  } catch {
    stores = [];
  } finally {
    hydrated = true;
    emit();
  }
}

async function persist(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(stores));
  } catch {
    // Storage unavailable — keep the in-memory state so the current
    // session still works.
  }
}

export function getPreferredStores(): StoreKey[] {
  return stores;
}

export async function setPreferredStores(next: StoreKey[]): Promise<void> {
  // Re-validate at the boundary so callers can pass anything.
  const seen = new Set<StoreKey>();
  const cleaned: StoreKey[] = [];
  for (const v of next) {
    if (isStoreKey(v) && !seen.has(v)) {
      seen.add(v);
      cleaned.push(v);
      if (cleaned.length >= MAX_STORES) break;
    }
  }
  stores = cleaned;
  emit();
  await persist();
}

export async function togglePreferredStore(key: StoreKey): Promise<void> {
  const has = stores.includes(key);
  if (has) {
    await setPreferredStores(stores.filter((s) => s !== key));
  } else if (stores.length < MAX_STORES) {
    await setPreferredStores([...stores, key]);
  }
  // At-cap toggles are no-ops — the picker UI surfaces a disabled state
  // so the user understands why nothing changed.
}

// React subscription. Hydrate-on-first-mount keeps the rest of the
// codebase from worrying about init order.
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function snapshot(): StoreKey[] {
  return stores;
}

export function useStorePrefs(): StoreKey[] {
  const value = useSyncExternalStore(subscribe, snapshot, snapshot);
  useEffect(() => {
    void hydrate();
  }, []);
  return value;
}

export function storeOption(key: StoreKey): StoreOption {
  // Non-null thanks to the discriminated key type, but defensive in case
  // STORE_OPTIONS is edited and a key gets orphaned.
  return STORE_OPTIONS.find((s) => s.key === key) ?? STORE_OPTIONS[0];
}

export const PREFERRED_STORES_LIMIT = MAX_STORES;
