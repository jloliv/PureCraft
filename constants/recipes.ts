// Loads the launch-recipes-v3.json catalog and exposes the typed query
// surface used everywhere the app touches the 100 launch recipes:
// - getRecipesByCategory(key)
// - searchRecipes(query)
// - findRecipeById(id)
// - getRecommendedRecipes(prefs)
// - tagsForRecipe(recipe)
//
// Every recipe is normalized once at module load: legacy `category` strings
// (including the stray "Kitchen") are mapped to a single canonical key from
// recipe-categories.ts, and stable `tags` are derived from title + ingredients
// so search and Quick-Tools filtering work without hand-tagging every entry.

import recipesJson from './launch-recipes-v3.json';
import {
  CATEGORY_LABEL_TO_KEY,
  type RecipeCategoryKey,
  RECIPE_CATEGORIES,
} from './recipe-categories';
// PROBLEMS / recipeMatchesProblem live in recipe-problems.ts, which only
// imports the Recipe TYPE from this file (type-only imports are erased at
// runtime), so this back-import is safe. Without it the search engine
// can't expand chip queries like "Stains" / "Mold" / "Dust" into the
// curated problem catalog.
import { PROBLEMS, recipeMatchesProblem } from './recipe-problems';

export type RecipeDifficulty = 'Easy' | 'Medium' | 'Hard';

export type RawRecipe = {
  id: number | string;
  /**
   * Optional explicit slug override. Use this when a title would otherwise
   * collide with another recipe (e.g. two "Iron Spray" variants), so the
   * runtime ID gets a descriptive suffix instead of an auto-numeric one.
   * Example: { id: 96, slug: "iron-spray-softener", title: "Iron Spray" }.
   */
  slug?: string;
  title: string;
  category: string;
  difficulty: RecipeDifficulty;
  time: string;
  ingredients: string[];
  instructions: string[];
  safeForKids: boolean;
  costSavings: string;
};

export type Recipe = {
  id: string; // string everywhere — easier with router params
  numericId: number;
  title: string;
  categoryKey: RecipeCategoryKey;
  categoryLabel: string;
  difficulty: RecipeDifficulty;
  time: string;
  ingredients: string[];
  instructions: string[];
  safeForKids: boolean;
  costSavings: string;
  tags: string[];
  /** Curated flag — true = featured in Pantry Magic. Defaults to false
   *  for legacy/v3 entries that don't carry the column. */
  pantryMagic?: boolean;
};

const RAW = recipesJson as RawRecipe[];

export function slugifyRecipeId(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function inferTags(r: RawRecipe, key: RecipeCategoryKey): string[] {
  const t = new Set<string>();
  t.add(r.difficulty);
  if (r.safeForKids) t.add('family-safe');
  const haystack = (r.title + ' ' + r.ingredients.join(' ')).toLowerCase();
  if (/spray|mist/.test(haystack)) t.add('spray');
  if (/scrub/.test(haystack)) t.add('scrub');
  if (/oil/.test(haystack)) t.add('oil');
  if (/baking soda|vinegar|water|salt|lemon/.test(haystack)) t.add('pantry');
  if (key === 'pet-safe') t.add('pet-safe');
  if (key === 'baby-family-safe') t.add('family-safe');
  if (key === 'emergency-budget-hacks') t.add('budget');
  return Array.from(t);
}

// Track every assigned recipe ID so we can detect collisions. When the
// catalog is sane (explicit `slug` overrides on every duplicate title),
// no ID should ever appear twice.
const seenRecipeIds = new Map<string, number>();

const RECIPES: Recipe[] = RAW.map((r, index) => {
  const categoryKey = CATEGORY_LABEL_TO_KEY[r.category] ?? 'cleaning';
  const canonicalCategory = RECIPE_CATEGORIES.find((c) => c.key === categoryKey)!;
  // Prefer an explicit slug override; fall back to a slug derived from the
  // title. If a collision still occurs (a new duplicate slips in without an
  // override), append the rawId so downstream lookups don't break — and the
  // runtime check below will surface a warning in dev.
  const preferredId = r.slug ?? slugifyRecipeId(r.title);
  const collisionCount = (seenRecipeIds.get(preferredId) ?? 0) + 1;
  seenRecipeIds.set(preferredId, collisionCount);
  const id = collisionCount === 1 ? preferredId : `${preferredId}-${r.id}`;
  return {
    id,
    numericId: typeof r.id === 'number' ? r.id : NaN,
    title: r.title,
    categoryKey,
    categoryLabel: canonicalCategory.label,
    difficulty: r.difficulty,
    time: r.time,
    ingredients: r.ingredients,
    instructions: r.instructions,
    safeForKids: r.safeForKids,
    costSavings: r.costSavings,
    tags: inferTags(r, categoryKey),
  };
});

// =============================================================================
// Dev-only duplicate-ID guard
// =============================================================================
//
// Recipe IDs must be unique — they're used as router params, dictionary keys,
// and to address per-recipe assets (icons, images, analytics events). A
// duplicate would silently overwrite UI state and route to the wrong recipe.
//
// In development we surface duplicates as a console.warn so they're caught
// before reaching production. In production this check is dead-stripped by
// the bundler (the __DEV__/process.env.NODE_ENV branch is statically false).

declare const __DEV__: boolean | undefined;

function isDevEnvironment(): boolean {
  if (typeof __DEV__ !== 'undefined') return !!__DEV__;
  if (typeof process !== 'undefined' && process.env?.NODE_ENV) {
    return process.env.NODE_ENV !== 'production';
  }
  return false;
}

export function findDuplicateRecipeIds(list: Recipe[] = RECIPES): string[] {
  const counts = new Map<string, number>();
  for (const r of list) counts.set(r.id, (counts.get(r.id) ?? 0) + 1);
  const dups: string[] = [];
  counts.forEach((n, id) => {
    if (n > 1) dups.push(id);
  });
  return dups;
}

if (isDevEnvironment()) {
  // Two checks: (1) any id assigned more than once at construction time
  // (i.e. an unhandled title collision that fell back to the numeric
  // suffix), and (2) any id that ended up duplicated in the final list
  // (defense in depth).
  const collidedBaseIds: string[] = [];
  seenRecipeIds.forEach((n, id) => {
    if (n > 1) collidedBaseIds.push(id);
  });
  if (collidedBaseIds.length > 0) {
    // eslint-disable-next-line no-console
    console.warn(
      '[recipes] Duplicate base IDs detected — add an explicit `slug` ' +
        'override on the colliding entries in launch-recipes-v3.json: ' +
        collidedBaseIds.join(', '),
    );
  }
  const finalDups = findDuplicateRecipeIds(RECIPES);
  if (finalDups.length > 0) {
    // eslint-disable-next-line no-console
    console.warn(
      '[recipes] Duplicate recipe IDs in final catalog: ' + finalDups.join(', '),
    );
  }
}

export const ALL_RECIPES: Recipe[] = RECIPES;

export function findRecipeById(id: string | number | undefined): Recipe | undefined {
  if (id == null) return undefined;
  const s = String(id);
  return RECIPES.find((r) => r.id === s || String(r.numericId) === s);
}

export function getRecipesByCategory(key: string): Recipe[] {
  if (key === 'all' || !key) return RECIPES;
  return RECIPES.filter((r) => r.categoryKey === key);
}

// Bathroom and Kitchen are surfaced as their own home-tile labels but in
// the catalog both fall under the 'cleaning' category. So a literal
// substring search for "bathroom" only catches the one recipe that uses
// the word in its title — useless to a user who taps the "Bathroom"
// suggestion chip expecting bathroom-y recipes. This map expands those
// queries to the underlying categoryKey so the chip surfaces the full
// cleaning catalog.
const ROOM_TO_CATEGORY_KEY: Record<string, RecipeCategoryKey> = {
  bathroom: 'cleaning',
  bath: 'cleaning',
  kitchen: 'cleaning',
};

// Common-language → catalog-language synonyms. When a user searches for a
// surface or product they recognize but that the catalog files under a
// different name, we widen the haystack search to include the canonical
// term too. Example: "mirror" and "window" both expand to "glass" so the
// Glass Cleaner recipe surfaces — neither word appears in its title or
// ingredients.
//
// Add new entries here when a query reasonably should hit a recipe whose
// catalog vocabulary is different. Keep keys lowercase + singular; the
// search already strips a trailing "s" before lookup so "mirrors" and
// "windows" auto-resolve.
const QUERY_SYNONYMS: Record<string, string[]> = {
  mirror: ['glass'],
  window: ['glass'],
};

type TokenExpansion = {
  /** Token + plural-stripped form. Match anywhere in the haystack. */
  primary: string[];
  /** Synonym substitutions ("mirror" → "glass"). Match ONLY in the
   *  strong haystack (title / categoryLabel / categoryKey / tags) so we
   *  never let an incidental ingredient mention sweep an unrelated
   *  recipe in (e.g. a candle that uses a "glass jar" as a container). */
  synonym: string[];
  /** Room → category shortcut. Recipe matches if its categoryKey is in
   *  this list. */
  categoryKeys: RecipeCategoryKey[];
};

// Token-level expansion: given a single query token, return everything
// that should be tested against the catalog plus the categoryKey
// shortcut. Splitting primary vs synonym lets the filter apply different
// strictness to each.
function expandToken(token: string): TokenExpansion {
  const stripped = token.endsWith('s') && token.length > 2 ? token.slice(0, -1) : token;
  // Original token + its singular form are always primary. Partial typing
  // ("greas") and plural chips ("Stains") both work without depending on
  // the synonym table.
  const primary = Array.from(new Set([token, stripped])).filter(
    (s) => s.length > 0,
  );
  const synonym = QUERY_SYNONYMS[token] ?? QUERY_SYNONYMS[stripped] ?? [];
  const categoryKey =
    ROOM_TO_CATEGORY_KEY[token] ?? ROOM_TO_CATEGORY_KEY[stripped];
  return {
    primary,
    synonym,
    categoryKeys: categoryKey ? [categoryKey] : [],
  };
}

// Lower = more relevant. Used to sort matches so title hits surface
// before category / tag / ingredient hits — keeps Glass Cleaner above
// any recipe that just happens to mention "glass" in its ingredients.
function relevanceScore(
  recipe: Recipe,
  q: string,
  expansions: TokenExpansion[],
): number {
  const title = recipe.title.toLowerCase();
  // Best — the full query is a substring of the title.
  if (title.includes(q)) return 0;
  // Any primary needle in title.
  for (const exp of expansions) {
    if (exp.primary.some((n) => title.includes(n))) return 1;
  }
  // Synonym hit in title (e.g. "mirror" → "glass" → Glass Cleaner).
  for (const exp of expansions) {
    if (exp.synonym.some((n) => title.includes(n))) return 2;
  }
  const catText = `${recipe.categoryLabel} ${recipe.categoryKey}`.toLowerCase();
  for (const exp of expansions) {
    if (exp.primary.some((n) => catText.includes(n))) return 3;
    if (exp.synonym.some((n) => catText.includes(n))) return 4;
    if (exp.categoryKeys.includes(recipe.categoryKey)) return 5;
  }
  const tagText = recipe.tags.join(' ').toLowerCase();
  for (const exp of expansions) {
    if (exp.primary.some((n) => tagText.includes(n))) return 6;
  }
  // Ingredient mention only — weakest signal.
  return 7;
}

export function searchRecipes(query: string, source: Recipe[] = RECIPES): Recipe[] {
  const q = query.trim().toLowerCase();
  if (!q) return source;
  // Single-character queries are noise — almost any single letter
  // appears somewhere in the catalog. Return [] rather than spam the
  // dropdown. Empty query above keeps the "show everything" use case
  // (categories.tsx with no search active) working.
  if (q.length < 2) return [];

  // Spec: search must match against title, tags, ingredients, AND
  // category (label or key). Partial + case-insensitive: "vine"
  // matches "vinegar", "greas" matches "grease", etc.
  //
  // Strategy:
  //   1. Tokenize the query on whitespace, then for each token compute
  //      its expansions (primary + synonym + room→category).
  //   2. A recipe matches when EVERY token has at least one of:
  //        - a primary needle anywhere in the full haystack, OR
  //        - a synonym needle in the STRONG haystack (no ingredients), OR
  //        - a categoryKey shortcut hit.
  //      Per-token AND keeps multi-word queries like "window cleaner"
  //      honest — "window" hits Glass Cleaner via the synonym, "cleaner"
  //      hits the title.
  //   3. Problem-label fast path: chip taps for "Grease"/"Odor"/etc.
  //      expand via the curated regex in recipe-problems.ts so they
  //      surface curated catalogs even when the literal word doesn't
  //      appear in any single recipe.
  //   4. Rank by relevance — title matches before category before tag
  //      before ingredient — so the strongest hits land first in the UI.
  const tokens = q.split(/\s+/).filter(Boolean);
  const tokenExpansions = tokens.map(expandToken);

  const qStripped = q.endsWith('s') && q.length > 2 ? q.slice(0, -1) : q;
  const matchedProblem = PROBLEMS.find((p) => {
    const shortL = p.shortLabel.toLowerCase();
    const fullL = p.label.toLowerCase();
    return (
      shortL === q ||
      shortL === qStripped ||
      fullL.includes(q) ||
      fullL.includes(qStripped)
    );
  });

  const filtered = source.filter((recipe) => {
    // Problem fast-path — chip-style queries get the curated catalog
    // even when no single recipe contains the literal word.
    if (matchedProblem && recipeMatchesProblem(recipe, matchedProblem.id)) {
      return true;
    }
    const fullHaystack = [
      recipe.title,
      recipe.categoryLabel,
      recipe.categoryKey,
      ...recipe.tags,
      ...recipe.ingredients,
    ]
      .join(' ')
      .toLowerCase();
    // Strong fields only — title / category / tags. Synonym needles
    // must hit here, never on an ingredient mention. This is the line
    // that prevents "mirror" → "glass" from leaking a candle whose
    // ingredient list happens to mention a glass jar.
    const strongHaystack = [
      recipe.title,
      recipe.categoryLabel,
      recipe.categoryKey,
      ...recipe.tags,
    ]
      .join(' ')
      .toLowerCase();
    for (const exp of tokenExpansions) {
      const primaryHit = exp.primary.some((n) => fullHaystack.includes(n));
      const synonymHit = exp.synonym.some((n) => strongHaystack.includes(n));
      const categoryHit = exp.categoryKeys.includes(recipe.categoryKey);
      if (!primaryHit && !synonymHit && !categoryHit) return false;
    }
    return true;
  });

  // Rank: title matches first, then category, tag, ingredient. Stable
  // sort by original index keeps catalog order as tiebreaker so two
  // equally-strong matches don't reorder unpredictably between
  // keystrokes.
  const indexed = filtered.map((r, i) => ({
    r,
    i,
    s: relevanceScore(r, q, tokenExpansions),
  }));
  indexed.sort((a, b) => a.s - b.s || a.i - b.i);
  return indexed.map((x) => x.r);
}

// Numeric estimate parsed from "$5 saved" → 5. Used by the savings engine.
export function recipeSavingsUsd(r: Recipe): number {
  const m = r.costSavings.match(/\d+(\.\d+)?/);
  return m ? Number(m[0]) : 0;
}

// =============================================================================
// Personalization (Onboarding → results)
// =============================================================================

export type OnboardingPreferences = {
  intentCategoryKeys?: RecipeCategoryKey[];
  household?: string[];
  avoidances?: string[];
  scentPreferences?: string[];
  priorities?: string[];
};

const HAS_BABY_OR_KIDS = (h?: string[]) =>
  !!h?.some((x) => /babi|toddler|child|kid/i.test(x));
const HAS_PETS = (h?: string[]) => !!h?.some((x) => /pet/i.test(x));
const AVOIDS = (av: string[] | undefined, term: string) =>
  !!av?.some((x) => x.toLowerCase().includes(term.toLowerCase()));
const FRAGRANCE_SENSITIVE = (h?: string[]) =>
  !!h?.some((x) => /fragrance/i.test(x));

export function getRecommendedRecipes(
  prefs: OnboardingPreferences,
  source: Recipe[] = RECIPES,
): Recipe[] {
  const limit = 6;
  return source
    .filter((recipe) => {
      // Intent: only categories the user said they want
      if (prefs.intentCategoryKeys?.length) {
        if (!prefs.intentCategoryKeys.includes(recipe.categoryKey)) return false;
      }

      // Babies / kids in the home → safeForKids only
      if (HAS_BABY_OR_KIDS(prefs.household) && !recipe.safeForKids) return false;

      // Pets in the home → pet-safe category or pet-safe tag
      if (HAS_PETS(prefs.household)) {
        if (
          recipe.categoryKey !== 'pet-safe' &&
          !recipe.tags.includes('pet-safe')
        ) {
          // Allow if recipe is otherwise broadly safe (no harsh chemicals)
          if (!recipe.safeForKids) return false;
        }
      }

      // Fragrance sensitivity / "no essential oils" avoidance
      if (
        FRAGRANCE_SENSITIVE(prefs.household) ||
        AVOIDS(prefs.avoidances, 'essential oil') ||
        AVOIDS(prefs.avoidances, 'fragrance')
      ) {
        if (
          recipe.ingredients.some(
            (i) => /essential oil|drops|fragrance/i.test(i),
          )
        ) {
          return false;
        }
      }

      // Specific ingredient avoidances
      if (AVOIDS(prefs.avoidances, 'coconut')) {
        if (recipe.ingredients.some((i) => /coconut/i.test(i))) return false;
      }
      if (AVOIDS(prefs.avoidances, 'beeswax')) {
        if (recipe.ingredients.some((i) => /beeswax/i.test(i))) return false;
      }
      if (AVOIDS(prefs.avoidances, 'vinegar')) {
        if (recipe.ingredients.some((i) => /vinegar/i.test(i))) return false;
      }
      if (AVOIDS(prefs.avoidances, 'baking soda')) {
        if (recipe.ingredients.some((i) => /baking soda/i.test(i))) return false;
      }
      if (AVOIDS(prefs.avoidances, 'citric acid')) {
        if (recipe.ingredients.some((i) => /citric acid/i.test(i))) return false;
      }

      return true;
    })
    .slice(0, limit);
}
