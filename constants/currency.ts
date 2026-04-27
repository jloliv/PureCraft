import { useSyncExternalStore } from 'react';

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY';

export type Currency = {
  code: CurrencyCode;
  symbol: string;
  name: string;
  flag: string;
  rateFromUsd: number;
  decimals: number;
};

export const CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸', rateFromUsd: 1, decimals: 2 },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺', rateFromUsd: 0.92, decimals: 2 },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧', rateFromUsd: 0.79, decimals: 2 },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', flag: '🇨🇦', rateFromUsd: 1.36, decimals: 2 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺', rateFromUsd: 1.51, decimals: 2 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵', rateFromUsd: 156, decimals: 0 },
];

const STORAGE_KEY = 'purecraft.currency';

function loadInitialCode(): CurrencyCode {
  try {
    const ls: Storage | undefined = (globalThis as { localStorage?: Storage }).localStorage;
    const stored = ls?.getItem(STORAGE_KEY);
    if (stored && CURRENCIES.some((c) => c.code === stored)) {
      return stored as CurrencyCode;
    }
  } catch {
    // ignore — native or restricted env
  }
  return 'USD';
}

function persistCode(code: CurrencyCode) {
  try {
    const ls: Storage | undefined = (globalThis as { localStorage?: Storage }).localStorage;
    ls?.setItem(STORAGE_KEY, code);
  } catch {
    // ignore
  }
}

let currentCode: CurrencyCode = loadInitialCode();
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

function getSnapshot(): CurrencyCode {
  return currentCode;
}

export function getCurrency(code?: CurrencyCode): Currency {
  const target = code ?? currentCode;
  return CURRENCIES.find((c) => c.code === target) ?? CURRENCIES[0];
}

export function setCurrency(code: CurrencyCode) {
  if (code === currentCode) return;
  currentCode = code;
  persistCode(code);
  emit();
}

export function useCurrency(): { currency: Currency; setCurrency: (code: CurrencyCode) => void } {
  const code = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return { currency: getCurrency(code), setCurrency };
}

export function formatMoney(
  amountUsd: number,
  opts?: { currency?: Currency; decimals?: number; round?: boolean },
): string {
  const c = opts?.currency ?? getCurrency();
  const converted = amountUsd * c.rateFromUsd;
  const decimals = opts?.decimals ?? c.decimals;
  const value = opts?.round ? Math.round(converted).toString() : converted.toFixed(decimals);
  return `${c.symbol}${value}`;
}
