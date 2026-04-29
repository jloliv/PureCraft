// Generates db/seed_recipes.sql from the in-app data:
//   - constants/launch-recipes-v3.json    (100 recipes)
//   - constants/recipe-benefits.ts        (hero benefits — extracted via regex)
//   - constants/recipe-shelf-life.ts      (hero shelf life)
//   - constants/savings.ts                (RETAIL_OVERRIDES)
//   - constants/ingredient-help.ts        (~30 ingredient help entries)
//
// Run from project root:  node db/build-seed.mjs
//
// Uses naive regex parsing of the TS files so it stays dependency-free
// (no need for ts-node / tsc). The constants files use object-literal
// syntax that's predictable enough for this approach.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = dirname(here);

// ---- helpers ---------------------------------------------------------------
const sqlString = (v) => {
  if (v == null) return 'null';
  return `'${String(v).replace(/'/g, "''")}'`;
};
const sqlBool = (v) => (v ? 'true' : 'false');
const sqlJson = (obj) => `'${JSON.stringify(obj).replace(/'/g, "''")}'::jsonb`;
const sqlBadgeArr = (arr) =>
  arr.length === 0
    ? `'{}'::shelf_life_badge[]`
    : `array[${arr.map(sqlString).join(', ')}]::shelf_life_badge[]`;

const CATEGORY_LABEL_TO_KEY = {
  'Cleaning': 'cleaning',
  'Laundry': 'laundry',
  'Beauty & Skincare': 'beauty-skincare',
  'Hair Care': 'hair-care',
  'Baby & Family Safe': 'baby-family-safe',
  'Home & Air Freshening': 'home-air-freshening',
  'Pet Safe': 'pet-safe',
  'Garden / Outdoor': 'garden-outdoor',
  'Seasonal / Holiday': 'seasonal-holiday',
  'Emergency / Budget Hacks': 'emergency-budget-hacks',
  'Kitchen': 'cleaning', // fold the lone Kitchen recipe into cleaning
};

function inferTags(r, key) {
  const t = new Set();
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

// ---- recipes ---------------------------------------------------------------
const recipes = JSON.parse(
  readFileSync(join(root, 'constants/launch-recipes-v3.json'), 'utf8'),
);

// ---- recipe-benefits.ts ---------------------------------------------------
// Extract PER_PRODUCT entries by parsing the TS source. We treat the file as
// text and walk object literals between "const PER_PRODUCT" and "const PER_CATEGORY".
const benefitsSrc = readFileSync(
  join(root, 'constants/recipe-benefits.ts'),
  'utf8',
);

function extractObjectLiterals(src, startMarker, endMarker) {
  const startIdx = src.indexOf(startMarker);
  const endIdx = src.indexOf(endMarker, startIdx);
  const body = src.slice(startIdx, endIdx);
  // Split by top-level keys: lines that start a quoted key followed by colon
  // followed by `{` at object depth 1.
  const entries = {};
  // Find each `'<key>': {` at column-leading whitespace
  const keyRe = /^\s{2}(?:'([^']+)'|([a-zA-Z][\w-]*)):\s*\{/gm;
  let m;
  while ((m = keyRe.exec(body)) !== null) {
    const key = m[1] ?? m[2];
    // Find the matching closing brace
    let depth = 1;
    let i = m.index + m[0].length;
    while (i < body.length && depth > 0) {
      const ch = body[i];
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      i++;
    }
    const objBody = body.slice(m.index + m[0].length, i - 1);
    entries[key] = parseFlatObject(objBody);
  }
  return entries;
}

function parseFlatObject(body) {
  // Parse a flat object literal of the form:
  //   benefits: [...],
  //   bestFor: [...],
  //   useFrequency: '...',
  //   whyItWorks: '...',
  //   notes: [...],
  //   badges: [...],
  //   duration: '...',
  //   storage: '...',
  //   bestKept: '...',
  //   etc.
  const out = {};
  // Strings
  const strRe = /(\w+):\s*'((?:[^'\\]|\\.)*)'/g;
  let m;
  while ((m = strRe.exec(body)) !== null) {
    out[m[1]] = m[2].replace(/\\'/g, "'").replace(/\\n/g, '\n');
  }
  // Arrays of strings
  const arrRe = /(\w+):\s*\[([\s\S]*?)\]/g;
  while ((m = arrRe.exec(body)) !== null) {
    const inner = m[2];
    const items = [];
    const itemRe = /'((?:[^'\\]|\\.)*)'/g;
    let im;
    while ((im = itemRe.exec(inner)) !== null) {
      items.push(im[1].replace(/\\'/g, "'").replace(/\\n/g, '\n'));
    }
    out[m[1]] = items;
  }
  return out;
}

const PER_PRODUCT_BENEFITS = extractObjectLiterals(
  benefitsSrc,
  'const PER_PRODUCT: Record<string, RecipeBenefits> = {',
  'const PER_CATEGORY:',
);

// ---- recipe-shelf-life.ts -------------------------------------------------
const shelfSrc = readFileSync(
  join(root, 'constants/recipe-shelf-life.ts'),
  'utf8',
);
const PER_PRODUCT_SHELF = extractObjectLiterals(
  shelfSrc,
  'const PER_PRODUCT: Record<string, ShelfLife> = {',
  'const PER_CATEGORY:',
);

// ---- savings.ts → RETAIL_OVERRIDES ----------------------------------------
const savingsSrc = readFileSync(join(root, 'constants/savings.ts'), 'utf8');
const overridesSection = savingsSrc.slice(
  savingsSrc.indexOf('export const RETAIL_OVERRIDES'),
  savingsSrc.indexOf('// =====', savingsSrc.indexOf('export const RETAIL_OVERRIDES')),
);
const overrides = {};
const ovRe = /(?:'([^']+)'|([a-zA-Z][\w-]*)):\s*\{\s*lowUsd:\s*([\d.]+),\s*highUsd:\s*([\d.]+),\s*label:\s*'((?:[^'\\]|\\.)*)'/g;
let ovm;
while ((ovm = ovRe.exec(overridesSection)) !== null) {
  const key = ovm[1] ?? ovm[2];
  overrides[key] = {
    low: Number(ovm[3]),
    high: Number(ovm[4]),
    label: ovm[5].replace(/\\'/g, "'"),
  };
}

// ---- ingredient-help.ts ---------------------------------------------------
const helpSrc = readFileSync(
  join(root, 'constants/ingredient-help.ts'),
  'utf8',
);
const helpEntries = extractObjectLiterals(
  helpSrc,
  'const HELP: Record<string, IngredientHelp> = {',
  '\n// Match longest',
);

// ---- write seed.sql -------------------------------------------------------
const out = [];
out.push('-- AUTO-GENERATED by db/build-seed.mjs — do not edit by hand.');
out.push('-- Re-run after editing the source data files in constants/.');
out.push('--');
out.push('-- Usage in Supabase SQL Editor:');
out.push('--   1. Apply db/0001_recipes.sql first');
out.push('--   2. Paste the contents of this file and run');
out.push('');
out.push('begin;');
out.push('');

// Track which recipe IDs land in the recipes table — used to filter the
// per-recipe hero tables so we don't violate FK constraints. We include
// both v3 numeric IDs and the 10 hand-curated string IDs (seeded by
// db/seed_heroes.sql) so their hero data lands too.
const HERO_STRING_IDS = [
  'bathroom-cleaner', 'glass-cleaner', 'kitchen-spray', 'floor-cleaner',
  'laundry-booster', 'room-spray', 'sugar-scrub', 'body-butter',
  'candle', 'linen-spray',
];
const recipeIds = new Set([
  ...recipes.map((r) => String(r.id)),
  ...HERO_STRING_IDS,
]);

// recipes
out.push('-- ===== recipes (' + recipes.length + ' rows) =====');
for (const r of recipes) {
  const id = String(r.id);
  const key = CATEGORY_LABEL_TO_KEY[r.category] ?? 'cleaning';
  // The category_label written to DB is the canonical label (folds Kitchen→Cleaning).
  const labelByKey = {
    cleaning: 'Cleaning',
    laundry: 'Laundry',
    'beauty-skincare': 'Beauty & Skincare',
    'hair-care': 'Hair Care',
    'baby-family-safe': 'Baby & Family Safe',
    'home-air-freshening': 'Home & Air Freshening',
    'pet-safe': 'Pet Safe',
    'garden-outdoor': 'Garden / Outdoor',
    'seasonal-holiday': 'Seasonal / Holiday',
    'emergency-budget-hacks': 'Emergency / Budget Hacks',
  };
  const tags = inferTags(r, key);
  out.push(
    `insert into public.recipes (id, numeric_id, title, category_label, category_key, difficulty, time_label, ingredients, instructions, safe_for_kids, cost_savings, tags, source, is_published) values (${[
      sqlString(id),
      r.id,
      sqlString(r.title),
      sqlString(labelByKey[key]),
      sqlString(key),
      sqlString(r.difficulty),
      sqlString(r.time),
      sqlJson(r.ingredients),
      sqlJson(r.instructions),
      sqlBool(r.safeForKids),
      sqlString(r.costSavings),
      sqlJson(tags),
      sqlString('catalog'),
      'true',
    ].join(', ')}) on conflict (id) do update set
  title = excluded.title,
  category_label = excluded.category_label,
  category_key = excluded.category_key,
  difficulty = excluded.difficulty,
  time_label = excluded.time_label,
  ingredients = excluded.ingredients,
  instructions = excluded.instructions,
  safe_for_kids = excluded.safe_for_kids,
  cost_savings = excluded.cost_savings,
  tags = excluded.tags;`,
  );
}
out.push('');

// recipe_benefits
out.push('-- ===== recipe_benefits (hero data) =====');
const benefitsForCatalog = Object.entries(PER_PRODUCT_BENEFITS).filter(([id]) =>
  recipeIds.has(id),
);
for (const [id, b] of benefitsForCatalog) {
  out.push(
    `insert into public.recipe_benefits (recipe_id, benefits, best_for, use_frequency, why_it_works) values (${[
      sqlString(id),
      sqlJson(b.benefits ?? []),
      sqlJson(b.bestFor ?? []),
      sqlString(b.useFrequency ?? null),
      sqlString(b.whyItWorks ?? null),
    ].join(', ')}) on conflict (recipe_id) do update set
  benefits = excluded.benefits,
  best_for = excluded.best_for,
  use_frequency = excluded.use_frequency,
  why_it_works = excluded.why_it_works;`,
  );
}
out.push('');

// recipe_shelf_life
out.push('-- ===== recipe_shelf_life (hero data) =====');
const shelfForCatalog = Object.entries(PER_PRODUCT_SHELF).filter(([id]) =>
  recipeIds.has(id),
);
for (const [id, s] of shelfForCatalog) {
  out.push(
    `insert into public.recipe_shelf_life (recipe_id, duration, storage, best_kept, notes, badges) values (${[
      sqlString(id),
      sqlString(s.duration ?? ''),
      sqlString(s.storage ?? ''),
      sqlString(s.bestKept ?? null),
      sqlJson(s.notes ?? []),
      sqlBadgeArr(s.badges ?? []),
    ].join(', ')}) on conflict (recipe_id) do update set
  duration = excluded.duration,
  storage = excluded.storage,
  best_kept = excluded.best_kept,
  notes = excluded.notes,
  badges = excluded.badges;`,
  );
}
out.push('');

// retail_overrides
out.push('-- ===== retail_overrides =====');
const overridesForCatalog = Object.entries(overrides).filter(([id]) =>
  recipeIds.has(id),
);
for (const [id, ov] of overridesForCatalog) {
  out.push(
    `insert into public.retail_overrides (recipe_id, low_usd, high_usd, label) values (${[
      sqlString(id),
      ov.low,
      ov.high,
      sqlString(ov.label),
    ].join(', ')}) on conflict (recipe_id) do update set
  low_usd = excluded.low_usd,
  high_usd = excluded.high_usd,
  label = excluded.label;`,
  );
}
out.push('');

// ingredient_help
out.push('-- ===== ingredient_help =====');
for (const [key, h] of Object.entries(helpEntries)) {
  out.push(
    `insert into public.ingredient_help (key, title, what, where_to_find, best_options, tips, substitutes, allergy_warnings, why_it_works) values (${[
      sqlString(key),
      sqlString(h.title),
      sqlString(h.what ?? ''),
      sqlJson(h.where ?? []),
      sqlJson(h.bestOptions ?? []),
      sqlJson(h.tips ?? []),
      sqlJson(h.substitutes ?? []),
      sqlJson(h.allergyWarnings ?? []),
      sqlString(h.whyItWorks ?? null),
    ].join(', ')}) on conflict (key) do update set
  title = excluded.title,
  what = excluded.what,
  where_to_find = excluded.where_to_find,
  best_options = excluded.best_options,
  tips = excluded.tips,
  substitutes = excluded.substitutes,
  allergy_warnings = excluded.allergy_warnings,
  why_it_works = excluded.why_it_works;`,
  );
}
out.push('');

out.push('commit;');
out.push('');
out.push('-- Sanity check counts:');
out.push("-- select 'recipes' as t, count(*) from recipes");
out.push("-- union all select 'recipe_benefits', count(*) from recipe_benefits");
out.push("-- union all select 'recipe_shelf_life', count(*) from recipe_shelf_life");
out.push("-- union all select 'retail_overrides', count(*) from retail_overrides");
out.push("-- union all select 'ingredient_help', count(*) from ingredient_help;");

writeFileSync(join(here, 'seed_recipes.sql'), out.join('\n') + '\n');

console.log('✓ wrote db/seed_recipes.sql');
console.log('  recipes:           ' + recipes.length);
console.log(
  '  recipe_benefits:   ' +
    benefitsForCatalog.length +
    ' (filtered from ' +
    Object.keys(PER_PRODUCT_BENEFITS).length +
    ' — ' +
    (Object.keys(PER_PRODUCT_BENEFITS).length - benefitsForCatalog.length) +
    ' rows belong to non-catalog string IDs)',
);
console.log('  recipe_shelf_life: ' + shelfForCatalog.length);
console.log('  retail_overrides:  ' + overridesForCatalog.length);
console.log('  ingredient_help:   ' + Object.keys(helpEntries).length);
