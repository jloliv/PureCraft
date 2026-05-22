// Canonical ingredient catalog — single source of truth for the pantry,
// recipe matching, search, and any future ingredient-aware feature.
//
// History: pantry data used to live inline in app/pantry.tsx (the
// PANTRY array) plus a partial copy of the alias map in
// lib/pantry-match.ts. That worked when there was one consumer; with
// recipe generation, ingredient search, and the upcoming AI build flow
// all wanting to reason about ingredients, the data needs to live in
// one place that everyone imports.
//
// Shape rationale:
//   - id        — stable slug, never changes once shipped (used as a
//                 storage key in the user's pantry).
//   - name      — display string ("White Vinegar", title case).
//   - category  — use-case bucket (cleaning / oil / beauty / kitchen /
//                 laundry). Drives recipe generation and tag chips.
//   - tags      — free-form descriptors (base, acid, deodorizer,
//                 antibacterial, etc.). Drives search relevance and
//                 filter chips.
//   - icon      — registry key into constants/ingredient-icons.ts.
//                 The renderer pulls an Image source from there if one
//                 is registered, otherwise falls back to `emoji`.
//   - emoji     — one-glyph fallback for the no-asset case. Also used
//                 throughout the existing pantry UI.
//   - group     — physical-storage category ('pantry' | 'oils' |
//                 'tools'). Drives the section grouping on the pantry
//                 management screen. Distinct from `category`, which
//                 is about USE rather than STORAGE.
//   - defaultIn — true = seed this ingredient into a new user's
//                 pantry on first launch (the "I probably already
//                 have this" set).
//   - aliases   — substrings the matcher checks when resolving a free-
//                 text ingredient ("1 cup white vinegar") back to an
//                 ingredient id. Critical for recipe → pantry matching;
//                 do NOT remove without adjusting lib/pantry-match.ts.

import type { ImageSourcePropType } from 'react-native';

export type IngredientCategory =
  | 'cleaning'
  | 'oil'
  | 'beauty'
  | 'kitchen'
  | 'laundry';

export type IngredientGroup = 'pantry' | 'oils' | 'tools';

/** Icon registry keys. Add a new key here, then register an asset (or
 *  null for emoji-fallback) in constants/ingredient-icons.ts. */
export type IngredientIconKey =
  | 'water'
  | 'vinegar'
  | 'baking'
  | 'soap'
  | 'bottle'
  | 'lemon'
  | 'lavender'
  | 'dropper'
  | 'jar'
  | 'leaf'
  | 'powder'
  | 'salt'
  | 'oil';

/** Scent family — drives fragrance-profile filtering / pairing logic. */
export type ScentProfile =
  | 'fresh'
  | 'citrus'
  | 'floral'
  | 'herbal'
  | 'earthy'
  | 'minty'
  | 'sweet';

export type Ingredient = {
  id: string;
  name: string;
  category: IngredientCategory;
  tags: string[];
  icon: IngredientIconKey;
  emoji: string;
  group: IngredientGroup;
  defaultIn?: boolean;
  aliases: string[];
  // ---------------- Smart-recommendation metadata (all optional) ----------
  // Drives the Recommended / Missing sections on the Tailor It screen and
  // future intent-based search. Fields are intentionally OPTIONAL so older
  // catalog entries keep working unchanged while we backfill metadata
  // ingredient-by-ingredient.
  /** Short canonical use-case tags. Matched against intent tags derived
   *  from a recipe (title + categoryKey) to power recommendations. Stick
   *  to lowercase singular nouns: 'mold', 'glass', 'wood', 'bathroom', etc. */
  useCases?: string[];
  /** Recipe ids this ingredient is particularly suited for. Optional —
   *  most recommendations should fall out of useCases-vs-intent matching,
   *  but this lets us hand-curate when needed. */
  compatibleRecipes?: string[];
  /** Family of scent the ingredient lends to a formula. Null for
   *  scent-neutral items (water, baking soda). */
  scentProfile?: ScentProfile | null;
  /** True for ingredients that meaningfully push a formula toward
   *  "stronger" cleaning power (tea tree, hydrogen peroxide, washing
   *  soda). Used to bias the Strength = strong control. */
  strengthBoost?: boolean;
  /** True for ingredients considered safe in the standard allergy-aware
   *  preset (fragrance-free, no common irritants). */
  allergySafe?: boolean;
  /** True for ingredients with a strong eco/sustainability story —
   *  used by the future sustainability-mode filter. */
  ecoFriendly?: boolean;
};

export const INGREDIENTS: Ingredient[] = [
  // ============================ CLEANING CORE ============================
  {
    id: 'baking-soda',
    name: 'Baking Soda',
    category: 'cleaning',
    tags: ['base', 'abrasive', 'odor'],
    icon: 'baking',
    emoji: '🧂',
    group: 'pantry',
    defaultIn: true,
    aliases: ['baking soda'],
    useCases: ['odor', 'grease', 'scrub', 'bathroom', 'kitchen', 'drain'],
    scentProfile: null,
    strengthBoost: false,
    allergySafe: true,
    ecoFriendly: true,
  },
  {
    id: 'white-vinegar',
    name: 'White Vinegar',
    category: 'cleaning',
    tags: ['base', 'acid', 'deodorizer'],
    icon: 'vinegar',
    emoji: '🍶',
    group: 'pantry',
    defaultIn: true,
    aliases: ['white vinegar', 'vinegar'],
    useCases: ['mold', 'glass', 'bathroom', 'kitchen', 'odor', 'disinfect'],
    scentProfile: null,
    strengthBoost: false,
    allergySafe: true,
    ecoFriendly: true,
  },
  {
    id: 'castile-soap',
    name: 'Castile Soap',
    category: 'cleaning',
    tags: ['soap', 'liquid'],
    icon: 'soap',
    emoji: '🫧',
    group: 'pantry',
    aliases: ['castile soap'],
    useCases: ['bathroom', 'kitchen', 'floor', 'baby', 'general'],
    scentProfile: null,
    strengthBoost: false,
    allergySafe: true,
    ecoFriendly: true,
  },
  {
    id: 'hydrogen-peroxide',
    name: 'Hydrogen Peroxide',
    category: 'cleaning',
    tags: ['disinfect', 'stain'],
    icon: 'bottle',
    emoji: '🧴',
    group: 'pantry',
    aliases: ['hydrogen peroxide', 'peroxide'],
    useCases: ['mold', 'disinfect', 'stain', 'bathroom', 'laundry'],
    scentProfile: null,
    strengthBoost: true,
    allergySafe: true,
    ecoFriendly: true,
  },
  {
    id: 'rubbing-alcohol',
    name: 'Rubbing Alcohol',
    category: 'cleaning',
    tags: ['disinfect', 'fast-dry'],
    icon: 'bottle',
    emoji: '🧴',
    group: 'pantry',
    aliases: ['rubbing alcohol', 'isopropyl alcohol'],
    useCases: ['disinfect', 'glass', 'electronics'],
    scentProfile: null,
    strengthBoost: true,
    allergySafe: false,
    ecoFriendly: false,
  },
  {
    id: 'witch-hazel',
    name: 'Witch Hazel',
    category: 'cleaning',
    tags: ['astringent', 'toner'],
    icon: 'bottle',
    emoji: '🌿',
    group: 'pantry',
    aliases: ['witch hazel'],
    useCases: ['skin', 'face', 'toner'],
    scentProfile: 'herbal',
    strengthBoost: false,
    allergySafe: true,
    ecoFriendly: true,
  },
  {
    id: 'distilled-water',
    name: 'Distilled Water',
    category: 'cleaning',
    tags: ['solvent', 'base'],
    icon: 'water',
    emoji: '💧',
    group: 'pantry',
    defaultIn: true,
    aliases: ['distilled water', 'water'],
    useCases: ['solvent', 'glass', 'spray', 'baby', 'face'],
    scentProfile: null,
    strengthBoost: false,
    allergySafe: true,
    ecoFriendly: true,
  },

  // ============================ ESSENTIAL OILS ===========================
  {
    id: 'lemon-eo',
    name: 'Lemon Essential Oil',
    category: 'oil',
    tags: ['scent', 'fresh'],
    icon: 'lemon',
    emoji: '🍋',
    group: 'oils',
    aliases: ['lemon essential oil', 'lemon eo'],
    useCases: ['odor', 'grease', 'kitchen', 'home-scent'],
    scentProfile: 'citrus',
    strengthBoost: false,
    allergySafe: false,
    ecoFriendly: true,
  },
  {
    id: 'lavender-oil',
    name: 'Lavender Oil',
    category: 'oil',
    tags: ['calming', 'scent'],
    icon: 'lavender',
    emoji: '🪻',
    group: 'oils',
    aliases: ['lavender oil', 'lavender essential oil'],
    useCases: ['home-scent', 'laundry', 'skin', 'baby', 'odor'],
    scentProfile: 'floral',
    strengthBoost: false,
    allergySafe: false,
    ecoFriendly: true,
  },
  {
    id: 'tea-tree-oil',
    name: 'Tea Tree Oil',
    category: 'oil',
    tags: ['antibacterial'],
    icon: 'dropper',
    emoji: '🌱',
    group: 'oils',
    aliases: ['tea tree oil'],
    useCases: ['mold', 'bathroom', 'odor', 'disinfect', 'skin'],
    scentProfile: 'herbal',
    strengthBoost: true,
    allergySafe: false,
    ecoFriendly: true,
  },
  {
    id: 'peppermint-oil',
    name: 'Peppermint Oil',
    category: 'oil',
    tags: ['fresh', 'cooling'],
    icon: 'dropper',
    emoji: '🌿',
    group: 'oils',
    aliases: ['peppermint oil', 'peppermint essential oil'],
    useCases: ['pest', 'home-scent', 'odor'],
    scentProfile: 'minty',
    strengthBoost: false,
    allergySafe: false,
    ecoFriendly: true,
  },
  {
    id: 'eucalyptus-oil',
    name: 'Eucalyptus Oil',
    category: 'oil',
    tags: ['respiratory'],
    icon: 'dropper',
    emoji: '🌿',
    group: 'oils',
    aliases: ['eucalyptus oil'],
    useCases: ['pest', 'home-scent', 'mold', 'bathroom'],
    scentProfile: 'herbal',
    strengthBoost: false,
    allergySafe: false,
    ecoFriendly: true,
  },
  {
    id: 'rosemary-oil',
    name: 'Rosemary Oil',
    category: 'oil',
    tags: ['scent', 'herbal'],
    icon: 'dropper',
    emoji: '🌾',
    group: 'oils',
    aliases: ['rosemary oil'],
    useCases: ['hair', 'home-scent'],
    scentProfile: 'herbal',
    strengthBoost: false,
    allergySafe: false,
    ecoFriendly: true,
  },

  // ============================ BEAUTY / BODY ============================
  {
    id: 'coconut-oil',
    name: 'Coconut Oil',
    category: 'beauty',
    tags: ['moisturizer', 'fat'],
    icon: 'jar',
    emoji: '🥥',
    group: 'pantry',
    defaultIn: true,
    aliases: ['coconut oil'],
    useCases: ['skin', 'hair', 'lotion', 'lip', 'baby'],
    scentProfile: 'sweet',
    strengthBoost: false,
    allergySafe: true,
    ecoFriendly: true,
  },
  {
    id: 'aloe-vera',
    name: 'Aloe Vera',
    category: 'beauty',
    tags: ['soothing', 'hydration'],
    icon: 'leaf',
    emoji: '🌵',
    group: 'pantry',
    aliases: ['aloe vera', 'aloe'],
    useCases: ['skin', 'face', 'baby', 'hair'],
    scentProfile: null,
    strengthBoost: false,
    allergySafe: true,
    ecoFriendly: true,
  },
  {
    id: 'shea-butter',
    name: 'Shea Butter',
    category: 'beauty',
    tags: ['hydration', 'moisturizer'],
    icon: 'jar',
    emoji: '🧈',
    group: 'pantry',
    aliases: ['shea butter'],
    useCases: ['skin', 'lotion', 'baby', 'lip', 'body-butter'],
    scentProfile: 'earthy',
    strengthBoost: false,
    allergySafe: true,
    ecoFriendly: true,
  },
  {
    id: 'honey',
    name: 'Honey',
    category: 'beauty',
    tags: ['humectant', 'soothing'],
    icon: 'jar',
    emoji: '🍯',
    group: 'pantry',
    aliases: ['honey'],
    useCases: ['skin', 'face', 'lip', 'hair'],
    scentProfile: 'sweet',
    strengthBoost: false,
    allergySafe: true,
    ecoFriendly: true,
  },

  // =========================== KITCHEN CROSSOVER =========================
  {
    id: 'cornstarch',
    name: 'Cornstarch',
    category: 'kitchen',
    tags: ['thickener', 'polish'],
    icon: 'powder',
    emoji: '🌽',
    group: 'pantry',
    aliases: ['cornstarch'],
    useCases: ['glass', 'polish', 'baby'],
    scentProfile: null,
    strengthBoost: false,
    allergySafe: true,
    ecoFriendly: true,
  },
  {
    id: 'sea-salt',
    name: 'Sea Salt',
    category: 'kitchen',
    tags: ['abrasive'],
    icon: 'salt',
    emoji: '🧂',
    group: 'pantry',
    aliases: ['sea salt', 'salt'],
    useCases: ['scrub', 'odor', 'drain', 'bath'],
    scentProfile: null,
    strengthBoost: false,
    allergySafe: true,
    ecoFriendly: true,
  },
  {
    id: 'sugar',
    name: 'Sugar',
    category: 'kitchen',
    tags: ['scrub', 'humectant'],
    icon: 'powder',
    emoji: '🍚',
    group: 'pantry',
    defaultIn: true,
    aliases: ['sugar', 'cane sugar', 'brown sugar'],
    useCases: ['scrub', 'skin', 'lip'],
    scentProfile: null,
    strengthBoost: false,
    allergySafe: true,
    ecoFriendly: true,
  },
  {
    id: 'olive-oil',
    name: 'Olive Oil',
    category: 'kitchen',
    tags: ['polish', 'condition'],
    icon: 'oil',
    emoji: '🫒',
    group: 'pantry',
    defaultIn: true,
    aliases: ['olive oil'],
    useCases: ['wood', 'polish', 'leather', 'skin', 'hair'],
    scentProfile: 'earthy',
    strengthBoost: false,
    allergySafe: true,
    ecoFriendly: true,
  },
  {
    id: 'lemon',
    name: 'Lemon',
    category: 'kitchen',
    tags: ['acid', 'fresh'],
    icon: 'lemon',
    emoji: '🍋',
    group: 'pantry',
    defaultIn: true,
    aliases: ['lemon', 'lemon peels', 'lemon juice'],
    useCases: ['kitchen', 'grease', 'odor', 'glass', 'wood'],
    scentProfile: 'citrus',
    strengthBoost: false,
    allergySafe: true,
    ecoFriendly: true,
  },

  // ================================ LAUNDRY ==============================
  {
    id: 'washing-soda',
    name: 'Washing Soda',
    category: 'laundry',
    tags: ['detergent', 'base'],
    icon: 'powder',
    emoji: '🧂',
    group: 'pantry',
    aliases: ['washing soda', 'sodium carbonate'],
    useCases: ['laundry', 'stain', 'grease'],
    scentProfile: null,
    strengthBoost: true,
    allergySafe: true,
    ecoFriendly: true,
  },
  {
    id: 'epsom-salt',
    name: 'Epsom Salt',
    category: 'laundry',
    tags: ['softener', 'mineral'],
    icon: 'salt',
    emoji: '🧂',
    group: 'pantry',
    aliases: ['epsom salt', 'epsom salts'],
    useCases: ['laundry', 'bath', 'scrub'],
    scentProfile: null,
    strengthBoost: false,
    allergySafe: true,
    ecoFriendly: true,
  },

  // ================================= TOOLS ===============================
  // Not "ingredients" in the chemistry sense, but lived in the pantry
  // catalog and the matching logic relies on them — kept here so the
  // refactor is loss-free. The pantry screen filters by `group: tools`
  // for its own section.
  {
    id: 'spray-bottles',
    name: 'Spray Bottles',
    category: 'cleaning',
    tags: ['vessel'],
    icon: 'bottle',
    emoji: '🧴',
    group: 'tools',
    defaultIn: true,
    aliases: ['spray bottle'],
  },
  {
    id: 'glass-jars',
    name: 'Glass Jars',
    category: 'cleaning',
    tags: ['vessel'],
    icon: 'jar',
    emoji: '🫙',
    group: 'tools',
    aliases: ['glass jar', 'jar'],
  },
  {
    id: 'funnel',
    name: 'Funnel',
    category: 'kitchen',
    tags: ['tool'],
    icon: 'bottle',
    emoji: '🥽',
    group: 'tools',
    aliases: ['funnel'],
  },
];

// =============================================================================
// Indices + helpers
// =============================================================================

const INGREDIENT_BY_ID = new Map(INGREDIENTS.map((i) => [i.id, i]));

export function findIngredient(id: string): Ingredient | undefined {
  return INGREDIENT_BY_ID.get(id);
}

/** Resolve a free-text ingredient string ("1 cup white vinegar") to its
 *  canonical Ingredient via the alias list. Returns undefined if no
 *  alias matches. */
export function ingredientFromText(raw: string): Ingredient | undefined {
  const norm = raw.trim().toLowerCase();
  // Most-specific alias wins — match longer aliases first so
  // "lavender essential oil" beats "lavender" when both register.
  // We sort once-per-call which is fine for ~30 ingredients.
  const sorted = [...INGREDIENTS].sort((a, b) => {
    const longestA = Math.max(...a.aliases.map((s) => s.length));
    const longestB = Math.max(...b.aliases.map((s) => s.length));
    return longestB - longestA;
  });
  for (const ing of sorted) {
    for (const alias of ing.aliases) {
      if (norm === alias || norm.includes(alias)) return ing;
    }
  }
  return undefined;
}

/** Plain-text search — partial + case-insensitive against name + tags
 *  + category. Used by the pantry add-ingredient picker and any future
 *  ingredient-search surface. */
export function searchIngredients(query: string): Ingredient[] {
  const q = query.trim().toLowerCase();
  if (!q) return INGREDIENTS;
  if (q.length < 2) return [];
  return INGREDIENTS.filter((i) => {
    if (i.name.toLowerCase().includes(q)) return true;
    if (i.category.toLowerCase().includes(q)) return true;
    if (i.tags.some((t) => t.toLowerCase().includes(q))) return true;
    return false;
  });
}

/** Helper: ingredients that should be in the user's pantry by default
 *  on first launch. Drives the seed in lib/pantry-store.ts. */
export const DEFAULT_PANTRY_IDS: readonly string[] = INGREDIENTS.filter(
  (i) => i.defaultIn,
).map((i) => i.id);

/** Convenience for screens that want to render by group section. */
export function ingredientsByGroup(group: IngredientGroup): Ingredient[] {
  return INGREDIENTS.filter((i) => i.group === group);
}

/** Convenience for recipe-generation surfaces that want everything in
 *  a use-case bucket. */
export function ingredientsByCategory(
  category: IngredientCategory,
): Ingredient[] {
  return INGREDIENTS.filter((i) => i.category === category);
}

// Re-export the Image source type so consumers don't have to import
// from react-native just to type-annotate icon resolutions.
export type { ImageSourcePropType };
