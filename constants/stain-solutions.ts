// Structured stain knowledge — drives the guided Stain Guide flow at
// /stain-guide and the search-fallback path when free-text returns
// nothing.
//
// Why structured (vs free-text): "blood" returns no recipe matches in
// the catalog, but every household needs a blood-stain solution. The
// spec's call: don't fail those queries — match them through this
// structured layer first, then fall back to recipe text-search.
//
// Categories follow stain chemistry — protein / tannin / oil / organic
// / chemical — because the right "what to avoid" advice depends on
// the stain class, not the surface. Surfaces are a separate dimension
// that filters which solutions even apply.
//
// recipeId mapping: the spec's example recipeIds (e.g. "wine-stain-
// lift", "coffee-stain-remover", "ink-remover") don't exist in the
// recipes catalog yet. Each entry below maps to the closest existing
// recipe so "Use Full Recipe" never dead-ends. The originally-spec'd
// id is preserved in `specRecipeId` for the Supabase migration, where
// new recipe rows can be authored later.
//
// To migrate this to Supabase later: see supabase/migrations/
// 0005_stain_solutions.sql — schema mirrors this shape 1:1.

export type StainCategory = 'protein' | 'tannin' | 'oil' | 'organic' | 'chemical';

export type StainSurface =
  | 'fabric'
  | 'carpet'
  | 'upholstery'
  | 'hard-surface';

export type StainUrgency = 'immediate' | 'normal';

export type StainSolution = {
  id: string;
  name: string;
  /** Emoji for grids — matches the spec's stain-type picker. */
  emoji: string;
  category: StainCategory;
  /** Free-text aliases the search-fallback path matches against
   *  (case-insensitive substring). */
  aliases: string[];
  surfaces: StainSurface[];
  urgency: StainUrgency;
  /** "What to avoid" copy — single short statement(s), not a paragraph. */
  avoid: string[];
  /** Ordered, action-oriented steps (≤ 6 words each ideally). */
  steps: string[];
  /** Closest existing recipe to link the result CTA to. Resolved at
   *  data-write time so the UI doesn't need a fallback. */
  recipeId: string;
  /** Original recipeId from the spec — preserved so a future content
   *  pass can author the dedicated recipe and swap recipeId to it. */
  specRecipeId: string;
};

// Surface-display labels — kept here so they're co-located with the
// type. Used by the surface-picker step.
export const STAIN_SURFACE_META: Record<
  StainSurface,
  { label: string; emoji: string }
> = {
  fabric: { label: 'Fabric', emoji: '👕' },
  carpet: { label: 'Carpet', emoji: '🧶' },
  upholstery: { label: 'Upholstery', emoji: '🛋️' },
  'hard-surface': { label: 'Hard surface', emoji: '🧼' },
};

// Category-display labels — for the result-screen tag.
export const STAIN_CATEGORY_META: Record<StainCategory, { label: string }> = {
  protein: { label: 'Protein stain' },
  tannin: { label: 'Tannin stain' },
  oil: { label: 'Oil-based stain' },
  organic: { label: 'Organic stain' },
  chemical: { label: 'Chemical stain' },
};

export const STAIN_SOLUTIONS: StainSolution[] = [
  // ============================ PROTEIN ===================================
  {
    id: 'blood',
    name: 'Blood Stain',
    emoji: '🩸',
    category: 'protein',
    aliases: ['blood', 'cut', 'injury'],
    surfaces: ['fabric', 'carpet', 'upholstery'],
    urgency: 'immediate',
    avoid: ['Hot water — it sets the stain'],
    steps: [
      'Rinse with cold water immediately',
      'Apply hydrogen peroxide or salt paste',
      'Blot gently — do not rub',
      'Repeat until stain lifts',
    ],
    recipeId: 'stain-stick',
    specRecipeId: 'cold-water-blood-remover',
  },
  {
    id: 'sweat',
    name: 'Sweat Stain',
    emoji: '💦',
    category: 'protein',
    aliases: ['sweat', 'underarm stain', 'pit stain'],
    surfaces: ['fabric'],
    urgency: 'normal',
    avoid: ['High heat drying before cleaning'],
    steps: [
      'Apply baking soda paste',
      'Let sit for 30 minutes',
      'Scrub lightly',
      'Wash with warm water',
    ],
    recipeId: 'sportswear-wash',
    specRecipeId: 'fabric-deodorizing-wash',
  },

  // ============================ TANNIN ====================================
  {
    id: 'wine',
    name: 'Wine Stain',
    emoji: '🍷',
    category: 'tannin',
    aliases: ['wine', 'red wine', 'juice'],
    surfaces: ['fabric', 'carpet', 'upholstery'],
    urgency: 'immediate',
    avoid: ['Heat before removal — it locks the color in'],
    steps: [
      'Blot immediately',
      'Apply salt or baking soda',
      'Add vinegar solution',
      'Rinse with cold water',
    ],
    recipeId: 'stain-stick',
    specRecipeId: 'wine-stain-lift',
  },
  {
    id: 'coffee',
    name: 'Coffee Stain',
    emoji: '☕',
    category: 'tannin',
    aliases: ['coffee', 'tea'],
    surfaces: ['fabric', 'carpet'],
    urgency: 'normal',
    avoid: ['Letting the stain set without treatment'],
    steps: [
      'Blot excess liquid',
      'Apply vinegar and water solution',
      'Blot again',
      'Rinse and repeat if needed',
    ],
    recipeId: 'stain-stick',
    specRecipeId: 'coffee-stain-remover',
  },

  // ============================== OIL =====================================
  {
    id: 'grease',
    name: 'Grease Stain',
    emoji: '🛢️',
    category: 'oil',
    aliases: ['oil', 'butter', 'cooking grease', 'food oil'],
    surfaces: ['fabric', 'carpet'],
    urgency: 'normal',
    avoid: ['Applying water first — it spreads the oil'],
    steps: [
      'Apply baking soda or cornstarch',
      'Let sit to absorb the oil',
      'Brush off the powder',
      'Apply dish soap and rinse',
    ],
    recipeId: 'grease-cutter',
    specRecipeId: 'grease-cutter',
  },
  {
    id: 'makeup',
    name: 'Makeup Stain',
    emoji: '💄',
    category: 'oil',
    aliases: ['foundation', 'cosmetics', 'lipstick'],
    surfaces: ['fabric'],
    urgency: 'normal',
    avoid: ['Rubbing aggressively — it embeds the pigment'],
    steps: [
      'Blot excess product',
      'Apply dish soap',
      'Gently scrub',
      'Rinse with warm water',
    ],
    recipeId: 'delicate-wash',
    specRecipeId: 'gentle-fabric-cleaner',
  },

  // ============================ ORGANIC ===================================
  {
    id: 'grass',
    name: 'Grass Stain',
    emoji: '🌿',
    category: 'organic',
    aliases: ['grass', 'outdoor stain', 'lawn'],
    surfaces: ['fabric'],
    urgency: 'normal',
    avoid: ['Delaying treatment too long'],
    steps: [
      'Apply vinegar solution',
      'Scrub gently',
      'Rinse with cold water',
      'Repeat if needed',
    ],
    recipeId: 'stain-stick',
    specRecipeId: 'fabric-stain-remover',
  },
  {
    id: 'mud',
    name: 'Mud Stain',
    emoji: '🟤',
    category: 'organic',
    aliases: ['dirt', 'soil', 'mud'],
    surfaces: ['fabric', 'carpet'],
    urgency: 'normal',
    avoid: ['Cleaning while wet — wait for it to dry first'],
    steps: [
      'Let mud dry completely',
      'Brush off excess dirt',
      'Apply cleaning solution',
      'Rinse and blot',
    ],
    recipeId: 'all-purpose-spray',
    specRecipeId: 'all-purpose-cleaner',
  },

  // ============================ CHEMICAL ==================================
  {
    id: 'ink',
    name: 'Ink Stain',
    emoji: '🖊️',
    category: 'chemical',
    aliases: ['pen', 'marker', 'ink'],
    surfaces: ['fabric'],
    urgency: 'immediate',
    avoid: ['Rubbing — it spreads the ink'],
    steps: [
      'Place a clean cloth under the stain',
      'Apply rubbing alcohol',
      'Blot from outside inward',
      'Repeat until removed',
    ],
    recipeId: 'stain-stick',
    specRecipeId: 'ink-remover',
  },
];

// =============================================================================
// Lookup + matching helpers
// =============================================================================

const BY_ID = new Map(STAIN_SOLUTIONS.map((s) => [s.id, s]));

export function findStainById(id: string | undefined): StainSolution | undefined {
  return id ? BY_ID.get(id) : undefined;
}

/** Surfaces the chosen stain actually supports — used by step 2 to
 *  hide irrelevant options instead of returning a useless result. */
export function surfacesForStain(stainId: string): StainSurface[] {
  return findStainById(stainId)?.surfaces ?? [];
}

/** Resolve a (stain, surface) pair to a single best-match solution.
 *  Returns the StainSolution itself when the surface is supported,
 *  null otherwise (caller should ask the user to pick differently). */
export function resolveStainResult(
  stainId: string,
  surface: StainSurface,
): StainSolution | null {
  const s = findStainById(stainId);
  if (!s) return null;
  if (!s.surfaces.includes(surface)) return null;
  return s;
}

/** Search-fallback path. When the user types something free-text into
 *  /search and no recipes match, we run the query through this matcher
 *  to surface the right structured solution.
 *
 *  Match priority:
 *   1. Exact alias match → that stain wins.
 *   2. Substring match on name or aliases → first hit.
 *   3. Otherwise undefined.
 *
 *  Single result per spec ("returns 1 best match, not a list").
 */
export function matchStainByQuery(query: string): StainSolution | undefined {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return undefined;
  // Exact alias match — highest confidence.
  for (const s of STAIN_SOLUTIONS) {
    if (s.aliases.some((a) => a === q)) return s;
  }
  // Substring match on aliases or name.
  for (const s of STAIN_SOLUTIONS) {
    if (s.name.toLowerCase().includes(q)) return s;
    if (s.aliases.some((a) => a.includes(q) || q.includes(a))) return s;
  }
  return undefined;
}

/** All solutions in a given category — kept for future "browse by
 *  chemistry class" surface (e.g. "show me all tannin stains"). Not
 *  used by the v1 UI but the data is here when we want it. */
export function stainsByCategory(category: StainCategory): StainSolution[] {
  return STAIN_SOLUTIONS.filter((s) => s.category === category);
}
