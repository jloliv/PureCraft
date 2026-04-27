import { useSyncExternalStore } from 'react';

import { setCurrency, type CurrencyCode } from './currency';

export type RegionCode = 'PT' | 'EU' | 'USA' | 'UK';

export type Region = {
  code: RegionCode;
  name: string;
  shortName: string;
  flag: string;
  currency: CurrencyCode;
  // Local cost-of-living multiplier vs USA = 1.00. Anchors the ingredient
  // database (USD) to local grocery prices for everyday DIY ingredients.
  costMultiplier: number;
  retailMultiplier: number;
  bottleUnit: 'spray bottle' | 'flacon';
  storeExamples: string;
};

export const REGIONS: Region[] = [
  {
    code: 'PT',
    name: 'Portugal',
    shortName: 'Portugal',
    flag: '🇵🇹',
    currency: 'EUR',
    costMultiplier: 0.78,
    retailMultiplier: 0.92,
    bottleUnit: 'flacon',
    storeExamples: 'Continente · Pingo Doce · Mercadona',
  },
  {
    code: 'EU',
    name: 'Eurozone',
    shortName: 'EU',
    flag: '🇪🇺',
    currency: 'EUR',
    costMultiplier: 0.94,
    retailMultiplier: 1.05,
    bottleUnit: 'flacon',
    storeExamples: 'Carrefour · Lidl · DM · Rossmann',
  },
  {
    code: 'USA',
    name: 'United States',
    shortName: 'USA',
    flag: '🇺🇸',
    currency: 'USD',
    costMultiplier: 1.0,
    retailMultiplier: 1.0,
    bottleUnit: 'spray bottle',
    storeExamples: 'Target · Whole Foods · Trader Joe’s',
  },
  {
    code: 'UK',
    name: 'United Kingdom',
    shortName: 'UK',
    flag: '🇬🇧',
    currency: 'GBP',
    costMultiplier: 0.95,
    retailMultiplier: 1.08,
    bottleUnit: 'spray bottle',
    storeExamples: 'Boots · Sainsbury’s · Holland & Barrett',
  },
];

const STORAGE_KEY = 'purecraft.region';

function loadInitial(): RegionCode {
  try {
    const ls: Storage | undefined = (globalThis as { localStorage?: Storage }).localStorage;
    const stored = ls?.getItem(STORAGE_KEY);
    if (stored && REGIONS.some((r) => r.code === stored)) {
      return stored as RegionCode;
    }
  } catch {
    // ignore
  }
  return 'USA';
}

let currentCode: RegionCode = loadInitial();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot(): RegionCode {
  return currentCode;
}

export function getRegion(code?: RegionCode): Region {
  const target = code ?? currentCode;
  return REGIONS.find((r) => r.code === target) ?? REGIONS[2];
}

export function setRegion(code: RegionCode) {
  if (code === currentCode) return;
  currentCode = code;
  try {
    const ls: Storage | undefined = (globalThis as { localStorage?: Storage }).localStorage;
    ls?.setItem(STORAGE_KEY, code);
  } catch {
    // ignore
  }
  // Region change implies the user shops in that region's local currency.
  // They can still override in Settings → Currency afterward.
  setCurrency(getRegion(code).currency);
  emit();
}

export function useRegion(): { region: Region; setRegion: (code: RegionCode) => void } {
  const code = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return { region: getRegion(code), setRegion };
}
