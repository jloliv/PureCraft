// App-facing DB row types.
//
// Source of truth: lib/db-types.gen.ts (generated from the live Supabase
// schema via `supabase gen types typescript --linked`). Regenerate that file
// whenever you change the schema; this file then automatically picks up
// renames, new enum values, etc.
//
// Why this layer exists: the generator types JSONB columns as `Json` (since
// Postgres can store any JSON there), but our application invariant is that
// `ingredients`, `instructions`, `tags`, `notes`, `badges` are always
// arrays of strings. We narrow those here so consumers don't have to cast.
//
// To regenerate: `supabase gen types typescript --linked 2>/dev/null > lib/db-types.gen.ts`
// (suppress stderr — it otherwise lands in line 1 and breaks the file).

import type { Database, Tables } from './db-types.gen';

export type { Database, Tables, TablesInsert, TablesUpdate } from './db-types.gen';

// --- Enum aliases (kept in sync by the generator) ----------------------------

export type RecipeCategoryKey = Database['public']['Enums']['recipe_category_key'];
export type RecipeDifficulty = Database['public']['Enums']['recipe_difficulty'];
export type ShelfLifeBadge = Database['public']['Enums']['shelf_life_badge'];

// --- Row types with JSON columns narrowed to app-level invariants ----------

export type RecipeRow = Omit<
  Tables<'recipes'>,
  'ingredients' | 'instructions' | 'tags' | 'source'
> & {
  ingredients: string[];
  instructions: string[];
  tags: string[];
  // The schema stores `source` as text; the app contract is one of three values.
  source: 'catalog' | 'user' | 'ai';
};

export type RecipeBenefitsRow = Omit<
  Tables<'recipe_benefits'>,
  'benefits' | 'best_for'
> & {
  benefits: string[];
  best_for: string[];
};

export type RecipeShelfLifeRow = Omit<
  Tables<'recipe_shelf_life'>,
  'notes' | 'badges'
> & {
  notes: string[];
  badges: ShelfLifeBadge[];
};

export type RetailOverrideRow = Tables<'retail_overrides'>;

export type IngredientHelpRow = Omit<
  Tables<'ingredient_help'>,
  | 'where_to_find'
  | 'best_options'
  | 'tips'
  | 'substitutes'
  | 'regions'
  | 'allergy_warnings'
> & {
  where_to_find: string[];
  best_options: string[];
  tips: string[];
  substitutes: string[];
  regions: Record<string, string[]>;
  allergy_warnings: string[];
};
