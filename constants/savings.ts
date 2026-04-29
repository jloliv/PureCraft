import { useSyncExternalStore } from 'react';

import { Currency, formatMoney, getCurrency } from './currency';
import { findProduct, ProductGroup, RECIPES } from './products';
import { getRegion, type Region } from './region';

// ============================================================================
// Ingredient cost database
// ----------------------------------------------------------------------------
// Centralized US-grocery ranges per typical recipe-sized amount. The per-recipe
// `Ingredient.storePriceUsd` values still drive single-recipe math; this DB is
// the trust anchor — when a price feels off, this is the source of truth and
// the range communicates honest uncertainty to the user.
// ============================================================================

export type IngredientCost = { lowUsd: number; highUsd: number };

const k = (s: string) => s.toLowerCase().trim();

export const INGREDIENT_DB: Record<string, IngredientCost> = {
  [k('Distilled water')]: { lowUsd: 0.10, highUsd: 0.40 },
  [k('Warm water')]: { lowUsd: 0.05, highUsd: 0.20 },
  [k('White vinegar')]: { lowUsd: 0.20, highUsd: 0.60 },
  [k('Apple cider vinegar')]: { lowUsd: 0.40, highUsd: 0.90 },
  [k('Castile soap')]: { lowUsd: 0.80, highUsd: 1.80 },
  [k('Baking soda')]: { lowUsd: 0.10, highUsd: 0.35 },
  [k('Washing soda')]: { lowUsd: 0.80, highUsd: 1.40 },
  [k('Citric acid')]: { lowUsd: 0.70, highUsd: 1.20 },
  [k('Coarse sea salt')]: { lowUsd: 0.40, highUsd: 0.70 },
  [k('Cornstarch')]: { lowUsd: 0.05, highUsd: 0.15 },
  [k('Rubbing alcohol')]: { lowUsd: 0.70, highUsd: 1.20 },
  [k('Witch hazel')]: { lowUsd: 0.90, highUsd: 1.80 },
  [k('Vegetable glycerin')]: { lowUsd: 0.20, highUsd: 0.60 },
  [k('Lemon peels')]: { lowUsd: 0.80, highUsd: 1.40 },
  [k('Granulated sugar')]: { lowUsd: 0.30, highUsd: 0.60 },
  [k('Coconut oil')]: { lowUsd: 1.40, highUsd: 2.40 },
  [k('Raw honey')]: { lowUsd: 0.70, highUsd: 1.20 },
  [k('Vanilla extract')]: { lowUsd: 0.30, highUsd: 0.70 },
  [k('Vitamin E oil')]: { lowUsd: 0.40, highUsd: 0.80 },
  [k('Shea butter')]: { lowUsd: 2.60, highUsd: 4.00 },
  [k('Cocoa butter')]: { lowUsd: 1.80, highUsd: 2.80 },
  [k('Sweet almond oil')]: { lowUsd: 1.20, highUsd: 1.90 },
  [k('Jojoba oil')]: { lowUsd: 1.10, highUsd: 1.80 },
  [k('Soy wax flakes')]: { lowUsd: 2.80, highUsd: 4.20 },
  [k('Cotton candle wick')]: { lowUsd: 0.30, highUsd: 0.60 },
  [k('Fragrance oil (cozy blend)')]: { lowUsd: 2.40, highUsd: 3.40 },
  [k('Glass jar (8 oz)')]: { lowUsd: 1.60, highUsd: 2.60 },
  [k('Wick centering bar')]: { lowUsd: 0.20, highUsd: 0.50 },
  [k('Tea tree oil')]: { lowUsd: 0.60, highUsd: 1.10 },
  [k('Lavender oil')]: { lowUsd: 0.45, highUsd: 0.90 },
  [k('Lavender essential oil')]: { lowUsd: 1.00, highUsd: 1.80 },
  [k('Lemon essential oil')]: { lowUsd: 0.80, highUsd: 1.40 },
  [k('Sweet orange oil')]: { lowUsd: 0.70, highUsd: 1.20 },
  [k('Eucalyptus essential oil')]: { lowUsd: 0.70, highUsd: 1.20 },
  [k('Cedarwood essential oil')]: { lowUsd: 0.55, highUsd: 1.00 },
  [k('Roman chamomile oil')]: { lowUsd: 1.10, highUsd: 1.80 },
  [k('Vanilla essential oil')]: { lowUsd: 1.10, highUsd: 1.80 },
};

export function lookupIngredient(name: string): IngredientCost | undefined {
  return INGREDIENT_DB[k(name)];
}

// ============================================================================
// Retail comparison pricing — by category, with per-product overrides
// ----------------------------------------------------------------------------
// Category fallback is a US grocery / drugstore mid-tier band. Overrides are
// the brands we have specific data for; when an override exists, `isEstimate`
// stays false. Without one, we fall back and flag the savings as estimated.
// ============================================================================

export type RetailRange = {
  lowUsd: number;
  highUsd: number;
  label: string;
};

export const RETAIL_PRICING_BY_CATEGORY: Record<ProductGroup, RetailRange> = {
  cleaning: { lowUsd: 4.50, highUsd: 9.00, label: 'mid-tier home brand' },
  beauty: { lowUsd: 12.00, highUsd: 28.00, label: 'salon-tier' },
  home: { lowUsd: 18.00, highUsd: 48.00, label: 'boutique candle / mist' },
};

export const RETAIL_OVERRIDES: Record<string, RetailRange> = {
  'bathroom-cleaner': { lowUsd: 5.49, highUsd: 7.99, label: 'name-brand spray' },
  'glass-cleaner': { lowUsd: 3.99, highUsd: 5.49, label: 'Windex-tier' },
  'kitchen-spray': { lowUsd: 5.99, highUsd: 8.99, label: 'Method / Mrs. Meyer\u2019s' },
  'floor-cleaner': { lowUsd: 6.99, highUsd: 9.99, label: 'name-brand floor wash' },
  'laundry-booster': { lowUsd: 4.99, highUsd: 7.99, label: 'OxiClean-tier' },
  'room-spray': { lowUsd: 7.99, highUsd: 12.99, label: 'natural home mist' },
  'sugar-scrub': { lowUsd: 12.00, highUsd: 18.00, label: 'spa-tier scrub' },
  'body-butter': { lowUsd: 16.00, highUsd: 24.00, label: 'salon-tier butter' },
  candle: { lowUsd: 22.00, highUsd: 34.00, label: 'boutique soy candle' },
  'linen-spray': { lowUsd: 8.50, highUsd: 14.00, label: 'natural linen mist' },

  // V3 launch-catalog hero retail anchors \u2014 the next 20.
  '3': { lowUsd: 4.99, highUsd: 7.99, label: 'Clorox-tier toilet tabs' },
  '9': { lowUsd: 4.99, highUsd: 8.99, label: 'mold-and-mildew remover' },
  '10': { lowUsd: 5.99, highUsd: 9.99, label: 'Drano-tier drain cleaner' },
  '12': { lowUsd: 6.99, highUsd: 11.99, label: 'Easy-Off-tier oven spray' },
  '17': { lowUsd: 4.99, highUsd: 8.99, label: 'Resolve-tier carpet powder' },
  '21': { lowUsd: 11.99, highUsd: 19.99, label: 'Tide-tier 60-load box' },
  '25': { lowUsd: 4.99, highUsd: 8.99, label: 'Tide-pen / OxiClean stick' },
  '27': { lowUsd: 14.99, highUsd: 24.99, label: 'salon-tier coffee scrub' },
  '28': { lowUsd: 6.99, highUsd: 12.99, label: 'Burt\u2019s-tier lip balm' },
  '32': { lowUsd: 11.99, highUsd: 24.99, label: 'pharmacy rosewater toner' },
  '41': { lowUsd: 14.99, highUsd: 24.99, label: 'salon-tier hair oil' },
  '45': { lowUsd: 9.99, highUsd: 14.99, label: 'aerosol dry shampoo' },
  '51': { lowUsd: 11.99, highUsd: 24.99, label: 'name-brand sensitive wipes' },
  '60': { lowUsd: 9.99, highUsd: 15.99, label: 'name-brand diaper-rash cream' },
  '67': { lowUsd: 7.99, highUsd: 14.99, label: 'kid bubble-bath bottle' },
  '73': { lowUsd: 7.99, highUsd: 14.99, label: 'holiday simmer mix' },
  '76': { lowUsd: 24.99, highUsd: 45.99, label: 'boutique reed diffuser' },
  '80': { lowUsd: 11.99, highUsd: 22.99, label: 'pet-store paw balm' },
  '86': { lowUsd: 9.99, highUsd: 15.99, label: 'plant-based bug spray' },
  '100': { lowUsd: 7.99, highUsd: 12.99, label: 'Bar Keepers Friend tier' },
};

// ============================================================================
// Plastic bottles avoided — per recipe
// ----------------------------------------------------------------------------
// 1 = a typical reusable spray / bottle. 0 = candle (no bottle saved).
// 2 = larger kits that replace two retail bottles (laundry boosters, etc).
// ============================================================================

const BOTTLES_PER_RECIPE: Record<string, number> = {
  'bathroom-cleaner': 1,
  'glass-cleaner': 1,
  'kitchen-spray': 1,
  'floor-cleaner': 1,
  'laundry-booster': 2,
  'room-spray': 1,
  'sugar-scrub': 1,
  'body-butter': 1,
  candle: 0,
  'linen-spray': 1,
};

// Roughly 70 g of PET/HDPE per bottle → ~2.5 oz → 0.155 lb
export const POUNDS_PER_BOTTLE = 0.155;

// ============================================================================
// Recipe cost + savings
// ============================================================================

export function getRecipeCostUsd(productId: string, region?: Region): number {
  const recipe = RECIPES[productId];
  if (!recipe) return 0;
  const r = region ?? getRegion();
  const usdSum = recipe.ingredients
    .filter((i) => !i.haveIt)
    .reduce((sum, i) => sum + (i.storePriceUsd ?? 0), 0);
  return usdSum * r.costMultiplier;
}

export function getFullRecipeCostUsd(productId: string, region?: Region): number {
  const recipe = RECIPES[productId];
  if (!recipe) return 0;
  const r = region ?? getRegion();
  return (
    recipe.ingredients.reduce((sum, i) => sum + (i.storePriceUsd ?? 0), 0) *
    r.costMultiplier
  );
}

export type SavingsEstimate = {
  productId: string;
  recipeCostUsd: number;
  retailLowUsd: number;
  retailHighUsd: number;
  retailMidUsd: number;
  retailLabel: string;
  savingsLowUsd: number;
  savingsHighUsd: number;
  savingsMidUsd: number;
  isEstimate: boolean;
  bottlesAvoided: number;
};

export function computeSavings(productId: string, region?: Region): SavingsEstimate {
  const product = findProduct(productId);
  const r = region ?? getRegion();
  const override = RETAIL_OVERRIDES[productId];
  const range = override ?? RETAIL_PRICING_BY_CATEGORY[product.group];
  const retailLowUsd = range.lowUsd * r.retailMultiplier;
  const retailHighUsd = range.highUsd * r.retailMultiplier;
  const retailMidUsd = (retailLowUsd + retailHighUsd) / 2;

  // V3 launch recipes don't carry per-ingredient `storePriceUsd` yet, so
  // `getRecipeCostUsd` returns 0 and savings would inflate to full retail.
  // When that happens, back-derive a believable cost from the recipe's
  // declared `savingsUsd` (parsed from "$X saved" in the JSON) so the
  // displayed savings stays aligned with the catalog's authored intent.
  let recipeCostUsd = getRecipeCostUsd(productId, r);
  if (recipeCostUsd === 0 && product.savingsUsd > 0) {
    recipeCostUsd = Math.max(0, retailMidUsd - product.savingsUsd);
  }
  return {
    productId,
    recipeCostUsd,
    retailLowUsd,
    retailHighUsd,
    retailMidUsd,
    retailLabel: range.label,
    savingsLowUsd: Math.max(0, retailLowUsd - recipeCostUsd),
    savingsHighUsd: Math.max(0, retailHighUsd - recipeCostUsd),
    savingsMidUsd: Math.max(0, retailMidUsd - recipeCostUsd),
    isEstimate: !override,
    bottlesAvoided: BOTTLES_PER_RECIPE[productId] ?? 1,
  };
}

// ============================================================================
// Made-recipe log (lifetime stats)
// ----------------------------------------------------------------------------
// Persists to localStorage for the web prototype. Falls back to seeded sample
// activity so the dashboard always shows believable numbers.
// ============================================================================

export type MadeEntry = {
  id: string;
  productId: string;
  madeAt: number;
  savingsUsd: number;
  bottlesAvoided: number;
};

const STORAGE_KEY = 'purecraft.savings.log';

const DAY_MS = 24 * 60 * 60 * 1000;

function seedLog(): MadeEntry[] {
  const now = Date.now();
  const seeds: { productId: string; daysAgo: number }[] = [
    { productId: 'bathroom-cleaner', daysAgo: 0 },
    { productId: 'kitchen-spray', daysAgo: 2 },
    { productId: 'glass-cleaner', daysAgo: 5 },
    { productId: 'bathroom-cleaner', daysAgo: 9 },
    { productId: 'linen-spray', daysAgo: 12 },
    { productId: 'sugar-scrub', daysAgo: 18 },
    { productId: 'body-butter', daysAgo: 24 },
    { productId: 'kitchen-spray', daysAgo: 28 },
    { productId: 'floor-cleaner', daysAgo: 45 },
    { productId: 'candle', daysAgo: 60 },
    { productId: 'laundry-booster', daysAgo: 90 },
    { productId: 'sugar-scrub', daysAgo: 120 },
    { productId: 'room-spray', daysAgo: 150 },
    { productId: 'bathroom-cleaner', daysAgo: 200 },
  ];
  return seeds.map((s, i) => {
    const e = computeSavings(s.productId);
    return {
      id: `seed-${i}`,
      productId: s.productId,
      madeAt: now - s.daysAgo * DAY_MS,
      savingsUsd: e.savingsMidUsd,
      bottlesAvoided: e.bottlesAvoided,
    };
  });
}

function loadInitial(): MadeEntry[] {
  try {
    const ls: Storage | undefined = (globalThis as { localStorage?: Storage }).localStorage;
    const raw = ls?.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.every((e) => typeof e?.productId === 'string')) {
        return parsed as MadeEntry[];
      }
    }
  } catch {
    // ignore — native or restricted env
  }
  return seedLog();
}

let logState: MadeEntry[] = loadInitial();
const listeners = new Set<() => void>();

function persist() {
  try {
    const ls: Storage | undefined = (globalThis as { localStorage?: Storage }).localStorage;
    ls?.setItem(STORAGE_KEY, JSON.stringify(logState));
  } catch {
    // ignore
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function logRecipeMade(productId: string) {
  const e = computeSavings(productId);
  logState = [
    ...logState,
    {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      productId,
      madeAt: Date.now(),
      savingsUsd: e.savingsMidUsd,
      bottlesAvoided: e.bottlesAvoided,
    },
  ];
  persist();
}

export function clearSavingsLog() {
  logState = [];
  persist();
}

// ============================================================================
// Stats derived from the log
// ============================================================================

export type SavingsStats = {
  todayUsd: number;
  monthUsd: number;
  monthLowUsd: number;
  monthHighUsd: number;
  lifetimeUsd: number;
  lifetimeLowUsd: number;
  lifetimeHighUsd: number;
  bottlesMonth: number;
  bottlesLifetime: number;
  recipesMonth: number;
  recipesLifetime: number;
  lastMadeAt: number | null;
};

function computeStats(entries: MadeEntry[]): SavingsStats {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todayMs = startOfToday.getTime();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const monthMs = startOfMonth.getTime();

  let todayUsd = 0;
  let monthUsd = 0;
  let lifetimeUsd = 0;
  let monthLowUsd = 0;
  let monthHighUsd = 0;
  let lifetimeLowUsd = 0;
  let lifetimeHighUsd = 0;
  let bottlesMonth = 0;
  let bottlesLifetime = 0;
  let recipesMonth = 0;
  let recipesLifetime = 0;
  let lastMadeAt: number | null = null;

  for (const e of entries) {
    const est = computeSavings(e.productId);
    lifetimeUsd += e.savingsUsd;
    lifetimeLowUsd += est.savingsLowUsd;
    lifetimeHighUsd += est.savingsHighUsd;
    bottlesLifetime += e.bottlesAvoided;
    recipesLifetime += 1;
    if (lastMadeAt == null || e.madeAt > lastMadeAt) lastMadeAt = e.madeAt;
    if (e.madeAt >= monthMs) {
      monthUsd += e.savingsUsd;
      monthLowUsd += est.savingsLowUsd;
      monthHighUsd += est.savingsHighUsd;
      bottlesMonth += e.bottlesAvoided;
      recipesMonth += 1;
    }
    if (e.madeAt >= todayMs) {
      todayUsd += e.savingsUsd;
    }
  }

  return {
    todayUsd,
    monthUsd,
    monthLowUsd,
    monthHighUsd,
    lifetimeUsd,
    lifetimeLowUsd,
    lifetimeHighUsd,
    bottlesMonth,
    bottlesLifetime,
    recipesMonth,
    recipesLifetime,
    lastMadeAt,
  };
}

function getSnapshot(): MadeEntry[] {
  return logState;
}

export function useSavingsStats(): SavingsStats {
  const entries = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return computeStats(entries);
}

// ============================================================================
// Currency-aware formatting helpers — luxury/trustworthy presentation
// ============================================================================

export function formatRange(
  lowUsd: number,
  highUsd: number,
  opts?: { currency?: Currency; decimals?: number; round?: boolean },
): string {
  const c = opts?.currency ?? getCurrency();
  const span = highUsd - lowUsd;
  // Tight band (< $1.50 USD-equivalent) → collapse to single number, no false precision.
  if (span < 1.5) {
    return formatMoney((lowUsd + highUsd) / 2, { currency: c, decimals: opts?.decimals });
  }
  const round = opts?.round ?? span >= 4;
  const decimals = opts?.decimals ?? (round ? 0 : c.decimals);
  return `${formatMoney(lowUsd, { currency: c, decimals, round })}\u2009\u2013\u2009${formatMoney(
    highUsd,
    { currency: c, decimals, round },
  )}`;
}

export function formatPlasticWeight(
  bottles: number,
  unit: 'lb' | 'kg' = 'lb',
): string {
  const lb = bottles * POUNDS_PER_BOTTLE;
  if (unit === 'kg') {
    const kg = lb * 0.4536;
    if (kg < 0.1) return '\u003c\u202f100\u202fg';
    if (kg < 1) return `${Math.round(kg * 1000)}\u202fg`;
    return `${kg.toFixed(1)}\u202fkg`;
  }
  if (lb < 1) return `${(lb * 16).toFixed(1)}\u202foz`;
  return `${lb.toFixed(1)}\u202flb`;
}
