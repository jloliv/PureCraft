// Single source of truth for PureCraft recipe categorization.
// Used by Home cards, Quick Tools, Categories filter chips, Search,
// Onboarding personalization, and Saved collections — one key system,
// one shared label/description, no hidden duplicates.

export type RecipeCategoryKey =
  | 'cleaning'
  | 'laundry'
  | 'beauty-skincare'
  | 'hair-care'
  | 'baby-family-safe'
  | 'home-air-freshening'
  | 'pet-safe'
  | 'garden-outdoor'
  | 'seasonal-holiday'
  | 'emergency-budget-hacks';

export type RecipeCategory = {
  key: RecipeCategoryKey;
  label: string;
  homeLabel: string;
  description: string;
};

export const RECIPE_CATEGORIES: RecipeCategory[] = [
  {
    key: 'cleaning',
    label: 'Cleaning',
    homeLabel: 'Bathroom & Kitchen',
    description:
      'Non-toxic cleaners for sinks, showers, glass, floors, and everyday messes.',
  },
  {
    key: 'laundry',
    label: 'Laundry',
    homeLabel: 'Laundry',
    description: 'Detergents, stain removers, fresheners, and clothing care.',
  },
  {
    key: 'beauty-skincare',
    label: 'Beauty & Skincare',
    homeLabel: 'Beauty',
    description: 'Body scrubs, masks, oils, balms, and skin care basics.',
  },
  {
    key: 'hair-care',
    label: 'Hair Care',
    homeLabel: 'Hair Care',
    description: 'Curl sprays, oils, masks, scalp care, and detanglers.',
  },
  {
    key: 'baby-family-safe',
    label: 'Baby & Family Safe',
    homeLabel: 'Baby Safe',
    description:
      'Gentler recipes for families, children, nurseries, and sensitive households.',
  },
  {
    key: 'home-air-freshening',
    label: 'Home & Air Freshening',
    homeLabel: 'Comfort',
    description:
      'Linen sprays, room sprays, sachets, simmer pots, and fresheners.',
  },
  {
    key: 'pet-safe',
    label: 'Pet Safe',
    homeLabel: 'Pet Safe',
    description:
      'Pet bed sprays, odor neutralizers, paw balm, and toy cleaners.',
  },
  {
    key: 'garden-outdoor',
    label: 'Garden / Outdoor',
    homeLabel: 'Outdoor',
    description: 'Patio, plant, outdoor furniture, and garden care.',
  },
  {
    key: 'seasonal-holiday',
    label: 'Seasonal / Holiday',
    homeLabel: 'Seasonal',
    description:
      'Holiday sprays, simmer pots, seasonal scrubs, and limited-time recipes.',
  },
  {
    key: 'emergency-budget-hacks',
    label: 'Emergency / Budget Hacks',
    homeLabel: 'Budget Hacks',
    description: 'Quick low-cost recipes using pantry basics.',
  },
];

// Maps the legacy JSON `category` strings (and the stray "Kitchen") onto our
// canonical keys. The "Kitchen" outlier folds into 'cleaning' on purpose —
// no fake categories, no orphaned recipes.
export const CATEGORY_LABEL_TO_KEY: Record<string, RecipeCategoryKey> = {
  Cleaning: 'cleaning',
  Laundry: 'laundry',
  'Beauty & Skincare': 'beauty-skincare',
  'Hair Care': 'hair-care',
  'Baby & Family Safe': 'baby-family-safe',
  'Home & Air Freshening': 'home-air-freshening',
  'Pet Safe': 'pet-safe',
  'Garden / Outdoor': 'garden-outdoor',
  'Seasonal / Holiday': 'seasonal-holiday',
  'Emergency / Budget Hacks': 'emergency-budget-hacks',
  Kitchen: 'cleaning',
};

const KEY_TO_CATEGORY: Record<RecipeCategoryKey, RecipeCategory> = Object.fromEntries(
  RECIPE_CATEGORIES.map((c) => [c.key, c]),
) as Record<RecipeCategoryKey, RecipeCategory>;

export function categoryByKey(key: string | undefined): RecipeCategory | undefined {
  if (!key) return undefined;
  return KEY_TO_CATEGORY[key as RecipeCategoryKey];
}

export function labelToKey(label: string): RecipeCategoryKey {
  return CATEGORY_LABEL_TO_KEY[label] ?? 'cleaning';
}
