// Freemium quota engine. One source of truth for "what can this user do
// right now without upgrading?"
//
// Design choices:
//  - Counters live in AsyncStorage (native) / localStorage (web) so they
//    survive app restarts but reset on uninstall. Move to a Supabase table
//    once we want server-enforced limits across devices.
//  - Premium status is read live from `lib/paywall.ts` — the moment the
//    user upgrades, every gate flips open without a refresh.
//  - All gating logic is centralized here. Screens never decide on their
//    own — they ask `checkScanGate()`, `checkSaveGate()`, etc. and react.
//  - Daily limits (scan) auto-reset by checking the date stamp on read.
//
// Tweak the numbers in the LIMITS block below and the whole app updates.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

import { isPremium, usePaywall } from './paywall';

// ---------- Limits ----------------------------------------------------------

export const LIMITS = {
  /** How many label scans a free user gets per calendar day. */
  scansPerDay: 3,
  /** Bonus scan unlocked after the soft modal on attempt #N+1. */
  bonusScans: 1,
  /** Max recipes a free user can save before the soft gate. */
  savedRecipes: 5,
  /** After this many recipe views, additional recipes are locked behind blur. */
  freeBrowseRecipes: 10,
} as const;

// ---------- Storage abstraction --------------------------------------------

const STORAGE_KEY = 'purecraft_freemium_v1';

type Snapshot = {
  // Calendar date in YYYY-MM-DD for daily counters. Resets when this rolls.
  scanDate: string;
  scansToday: number;
  bonusScansUsed: number;
  // Cumulative — never resets except on signout/account-delete.
  saveCount: number;
  // Set once the user has dismissed the soft scan modal at least once today;
  // used to ensure we only show it once per session.
  softScanModalShownToday: boolean;
};

const EMPTY: Snapshot = {
  scanDate: today(),
  scansToday: 0,
  bonusScansUsed: 0,
  saveCount: 0,
  softScanModalShownToday: false,
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

async function readRaw(): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return globalThis.localStorage?.getItem(STORAGE_KEY) ?? null;
    } catch {
      return null;
    }
  }
  try {
    return await AsyncStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

async function writeRaw(value: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      globalThis.localStorage?.setItem(STORAGE_KEY, value);
    } catch {
      // ignore
    }
    return;
  }
  try {
    await AsyncStorage.setItem(STORAGE_KEY, value);
  } catch {
    // ignore
  }
}

// ---------- In-memory store + subscription ---------------------------------

let state: Snapshot = { ...EMPTY };
const listeners = new Set<() => void>();
let hydrated = false;

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function snapshot(): Snapshot {
  return state;
}

// Hydrate on module load. Also rolls daily counters if the saved date is stale.
void (async () => {
  const raw = await readRaw();
  if (raw) {
    try {
      state = { ...EMPTY, ...(JSON.parse(raw) as Partial<Snapshot>) };
    } catch {
      state = { ...EMPTY };
    }
  }
  if (state.scanDate !== today()) {
    // New day — reset scan counters.
    state = {
      ...state,
      scanDate: today(),
      scansToday: 0,
      bonusScansUsed: 0,
      softScanModalShownToday: false,
    };
    await writeRaw(JSON.stringify(state));
  }
  hydrated = true;
  emit();
})();

async function patch(p: Partial<Snapshot>): Promise<void> {
  state = { ...state, ...p };
  emit();
  await writeRaw(JSON.stringify(state));
}

// ---------- Public hooks ----------------------------------------------------

export function useFreemium() {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

export function isFreemiumHydrated(): boolean {
  return hydrated;
}

// ---------- Gate types ------------------------------------------------------

export type Gate =
  | { allow: true; remaining: number }
  | {
      allow: false;
      reason: 'soft-scan' | 'hard-scan' | 'soft-save' | 'paywall' | 'preview';
      remaining: 0;
    };

// ---------- Scan gate -------------------------------------------------------
//
// Free users get LIMITS.scansPerDay (3). On the 4th attempt they see the
// "You're on a roll" soft modal which offers 1 bonus scan or a paywall.
// After the bonus scan, the next attempt hits the hard daily-limit modal.

export function checkScanGate(): Gate {
  if (isPremium()) return { allow: true, remaining: Infinity };
  const usedTotal = state.scansToday;
  if (usedTotal < LIMITS.scansPerDay) {
    return { allow: true, remaining: LIMITS.scansPerDay - usedTotal };
  }
  // We're past the free quota. Check bonus state.
  if (state.bonusScansUsed < LIMITS.bonusScans) {
    // Show the soft modal — caller decides whether to consume the bonus.
    return { allow: false, reason: 'soft-scan', remaining: 0 };
  }
  // Bonus already spent — hard gate.
  return { allow: false, reason: 'hard-scan', remaining: 0 };
}

/** Caller invokes this after a scan actually completed (success OR failure
 *  counts; we don't want users hammering the button to bypass). */
export async function recordScan(): Promise<void> {
  if (isPremium()) return;
  // If we're consuming a bonus, increment that counter instead.
  if (state.scansToday >= LIMITS.scansPerDay) {
    await patch({ bonusScansUsed: state.bonusScansUsed + 1 });
  } else {
    await patch({ scansToday: state.scansToday + 1 });
  }
}

/** Mark the soft modal as shown so we don't bombard users on every press. */
export async function markSoftScanModalShown(): Promise<void> {
  await patch({ softScanModalShownToday: true });
}

// ---------- Save gate -------------------------------------------------------
//
// Free users can save up to LIMITS.savedRecipes (5) recipes total. The 6th
// attempt opens a paywall.

export function checkSaveGate(): Gate {
  if (isPremium()) return { allow: true, remaining: Infinity };
  const remaining = LIMITS.savedRecipes - state.saveCount;
  if (remaining > 0) return { allow: true, remaining };
  return { allow: false, reason: 'soft-save', remaining: 0 };
}

export async function recordSave(): Promise<void> {
  if (isPremium()) return;
  await patch({ saveCount: state.saveCount + 1 });
}

export async function recordUnsave(): Promise<void> {
  if (isPremium()) return;
  // Free up a slot when they unsave. Floor at 0.
  await patch({ saveCount: Math.max(0, state.saveCount - 1) });
}

// ---------- Recipe browse lock ---------------------------------------------
//
// Free users see the first LIMITS.freeBrowseRecipes (10) recipes in any
// list. Items past that index are visually present but blurred + lock icon.
// `isRecipeLocked(idx)` is intended for callers iterating a sorted list.

export function isRecipeLocked(indexInList: number): boolean {
  if (isPremium()) return false;
  return indexInList >= LIMITS.freeBrowseRecipes;
}

// ---------- Pantry scan preview gate ---------------------------------------
//
// "Scan ingredients to add to pantry" is a premium-only feature, but we
// don't show the paywall on first tap — we show a preview screen explaining
// the value, then the paywall on Continue. The preview is implemented in
// app/pantry-scan-preview.tsx.

export function checkPantryScanGate(): Gate {
  if (isPremium()) return { allow: true, remaining: Infinity };
  return { allow: false, reason: 'preview', remaining: 0 };
}

// ---------- Convenience hook ------------------------------------------------
//
// Returns a single object screens can destructure to render quotas inline
// (e.g. "2 scans left today"). Re-renders when paywall state OR freemium
// snapshot changes.

export function useQuotas() {
  const fm = useFreemium();
  const { isPremium: paid } = usePaywall();
  return {
    isPremium: paid,
    scansLeft: paid
      ? Infinity
      : Math.max(0, LIMITS.scansPerDay - fm.scansToday),
    bonusScansLeft: paid
      ? Infinity
      : Math.max(0, LIMITS.bonusScans - fm.bonusScansUsed),
    savesLeft: paid ? Infinity : Math.max(0, LIMITS.savedRecipes - fm.saveCount),
  };
}
