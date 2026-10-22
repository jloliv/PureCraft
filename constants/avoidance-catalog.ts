// Avoidance catalog — single source of truth for the ingredient avoidance picker
// and the recipe filtering logic. Keep curated chips small for onboarding;
// extended list powers the searchable "see all" sheet.

export type AvoidanceItem = {
  key: string;
  label: string;
  /** Extra terms used to match this avoidance against recipe ingredient
   *  strings. When omitted, the lowercased label and dehyphenated key are
   *  used. Add aliases here for things like nuts → almond, walnut, ... */
  matchTerms?: string[];
};

export const PRIMARY_AVOIDANCES: AvoidanceItem[] = [
  { key: 'fragrance', label: 'Fragrance', matchTerms: ['fragrance', 'perfume'] },
  { key: 'eo', label: 'Essential Oils', matchTerms: ['essential oil'] },
  { key: 'chemical', label: 'Sensitive to chemicals', matchTerms: ['ammonia', 'bleach', 'sulfate'] },
  { key: 'coconut', label: 'Coconut' },
  { key: 'vinegar', label: 'Vinegar' },
  { key: 'baking-soda', label: 'Baking Soda', matchTerms: ['baking soda'] },
  { key: 'castile-soap', label: 'Castile Soap', matchTerms: ['castile soap', 'castile'] },
  { key: 'hydrogen-peroxide', label: 'Hydrogen Peroxide', matchTerms: ['hydrogen peroxide'] },
  { key: 'rubbing-alcohol', label: 'Rubbing Alcohol', matchTerms: ['rubbing alcohol', 'isopropyl'] },
  { key: 'witch-hazel', label: 'Witch Hazel', matchTerms: ['witch hazel'] },
  { key: 'nuts', label: 'Nuts', matchTerms: ['almond', 'walnut', 'cashew', 'pecan', 'hazelnut', 'pistachio'] },
  { key: 'gluten', label: 'Gluten', matchTerms: ['gluten', 'wheat', 'oat'] },
];

export const EXTENDED_AVOIDANCES: AvoidanceItem[] = [
  { key: 'aloe', label: 'Aloe Vera', matchTerms: ['aloe'] },
  { key: 'shea', label: 'Shea Butter', matchTerms: ['shea'] },
  { key: 'beeswax', label: 'Beeswax' },
  { key: 'lanolin', label: 'Lanolin' },
  { key: 'lavender', label: 'Lavender' },
  { key: 'tea-tree', label: 'Tea Tree', matchTerms: ['tea tree'] },
  { key: 'eucalyptus', label: 'Eucalyptus' },
  { key: 'peppermint', label: 'Peppermint' },
  { key: 'lemon', label: 'Lemon' },
  { key: 'orange', label: 'Orange' },
  { key: 'rosemary', label: 'Rosemary' },
  { key: 'chamomile', label: 'Chamomile' },
  { key: 'jojoba', label: 'Jojoba Oil', matchTerms: ['jojoba'] },
  { key: 'argan', label: 'Argan Oil', matchTerms: ['argan'] },
  { key: 'castor', label: 'Castor Oil', matchTerms: ['castor'] },
  { key: 'olive', label: 'Olive Oil', matchTerms: ['olive oil'] },
  { key: 'almond-oil', label: 'Sweet Almond Oil', matchTerms: ['almond oil', 'sweet almond'] },
  { key: 'cocoa-butter', label: 'Cocoa Butter', matchTerms: ['cocoa butter', 'cacao butter'] },
  { key: 'soy', label: 'Soy', matchTerms: ['soy', 'soybean'] },
  { key: 'dairy', label: 'Dairy', matchTerms: ['milk', 'butter', 'yogurt', 'cream'] },
  { key: 'eggs', label: 'Eggs', matchTerms: ['egg'] },
  { key: 'honey', label: 'Honey' },
  { key: 'borax', label: 'Borax' },
  { key: 'washing-soda', label: 'Washing Soda', matchTerms: ['washing soda', 'soda ash'] },
  { key: 'epsom-salt', label: 'Epsom Salt', matchTerms: ['epsom'] },
  { key: 'bentonite', label: 'Bentonite Clay', matchTerms: ['bentonite'] },
  { key: 'kaolin', label: 'Kaolin Clay', matchTerms: ['kaolin'] },
  { key: 'arrowroot', label: 'Arrowroot Powder', matchTerms: ['arrowroot'] },
  { key: 'cornstarch', label: 'Cornstarch' },
  { key: 'glycerin', label: 'Vegetable Glycerin', matchTerms: ['glycerin'] },
  { key: 'vitamin-e', label: 'Vitamin E Oil', matchTerms: ['vitamin e'] },
  { key: 'zinc-oxide', label: 'Zinc Oxide', matchTerms: ['zinc oxide'] },
  { key: 'citric-acid', label: 'Citric Acid', matchTerms: ['citric acid'] },
  { key: 'sea-salt', label: 'Sea Salt', matchTerms: ['sea salt'] },
  { key: 'sulfates', label: 'Sulfates', matchTerms: ['sulfate', 'sls', 'sles'] },
  { key: 'parabens', label: 'Parabens', matchTerms: ['paraben'] },
  { key: 'phthalates', label: 'Phthalates', matchTerms: ['phthalate'] },
  { key: 'synthetic-dyes', label: 'Synthetic Dyes', matchTerms: ['dye', 'fd&c'] },
];

export const ALL_AVOIDANCES: AvoidanceItem[] = (() => {
  const seen = new Set<string>();
  const list: AvoidanceItem[] = [];
  for (const item of [...PRIMARY_AVOIDANCES, ...EXTENDED_AVOIDANCES]) {
    if (seen.has(item.key)) continue;
    seen.add(item.key);
    list.push(item);
  }
  return list;
})();

const PRESET_BY_KEY = new Map(ALL_AVOIDANCES.map((it) => [it.key, it] as const));

const CUSTOM_PREFIX = 'custom:';

export function isCustomAvoidance(value: string): boolean {
  return value.toLowerCase().startsWith(CUSTOM_PREFIX);
}

export function toCustomAvoidanceKey(label: string): string {
  return `${CUSTOM_PREFIX}${label.trim().toLowerCase().replace(/\s+/g, '-')}`;
}

/** Turn a stored avoidance value into the search terms used to match against
 *  recipe ingredient strings. Handles preset keys (with curated aliases),
 *  hyphenated keys, and `custom:foo-bar` entries. All terms are lowercase.
 *  Substring matching means avoiding "aloe" naturally blocks "aloe vera",
 *  "aloe extract", and "aloe juice". */
export function avoidanceSearchTerms(value: string): string[] {
  const lower = value.toLowerCase();
  if (isCustomAvoidance(lower)) {
    const raw = lower.slice(CUSTOM_PREFIX.length).replace(/-/g, ' ').trim();
    return raw ? [raw] : [];
  }
  const preset = PRESET_BY_KEY.get(lower);
  if (preset) {
    const terms = new Set<string>();
    if (preset.matchTerms) {
      for (const t of preset.matchTerms) terms.add(t.toLowerCase().trim());
    }
    terms.add(preset.key.replace(/-/g, ' '));
    terms.add(preset.label.toLowerCase());
    return [...terms].filter(Boolean);
  }
  return [lower.replace(/-/g, ' ')];
}

/** True if the ingredient text contains any search term derived from the
 *  given avoidance value. Case-insensitive substring match. */
export function ingredientMatchesAvoidance(
  ingredientText: string,
  avoidance: string,
): boolean {
  const ingredient = ingredientText.toLowerCase();
  return avoidanceSearchTerms(avoidance).some(
    (term) => term.length > 0 && ingredient.includes(term),
  );
}

/** True if any of the user's avoidances matches any of the recipe's ingredients. */
export function recipeHasAvoidedIngredient(
  ingredients: string[],
  avoidances: string[],
): boolean {
  if (!avoidances.length) return false;
  return avoidances.some((av) =>
    ingredients.some((ing) => ingredientMatchesAvoidance(ing, av)),
  );
}

/** Pretty label for any stored avoidance — preset or custom. */
export function avoidanceLabel(value: string): string {
  const lower = value.toLowerCase();
  if (isCustomAvoidance(lower)) {
    return lower
      .slice(CUSTOM_PREFIX.length)
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return PRESET_BY_KEY.get(lower)?.label ?? value;
}
