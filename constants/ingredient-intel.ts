// Ingredient Intelligence — the structured knowledge layer that powers
// Pantry Magic, recipe explanations, "Best For" and "Avoid If" derivation,
// and Safety Tips.
//
// Why this exists:
//   With 130 recipes and growing, we cannot hand-author bestFor / avoidIf /
//   safetyNotes per recipe. Instead we encode the *ingredients* once here
//   and derive recipe-level intel at runtime from the ingredient list +
//   category. New recipes inherit intelligence automatically.
//
// Schema:
//   benefits: marketing-friendly bullets ("Lifts grease", "Deodorizes")
//   uses:     one-word capability tags used for `bestFor` derivation
//             ("grease", "odor", "stains", "scrub", "polish", …)
//   surfacesAvoid: surfaces or contexts to avoid when this ingredient is
//             present (drives "Avoid If")
//   incompatibleWith: ingredients you should never combine (drives Safety
//             Tips when both are in the same recipe)
//   safetyNotes: ingredient-level cautions surfaced as Safety Tips
//   categories: rough taxonomy for future filtering ("acid", "alkali",
//             "solvent", "humectant", "exfoliant", "emollient", …)

export type IngredientIntel = {
  benefits: string[];
  uses: string[];
  surfacesAvoid?: string[];
  incompatibleWith?: string[];
  safetyNotes?: string[];
  categories: string[];
};

export const INGREDIENT_INTEL: Record<string, IngredientIntel> = {
  // ---- Acids -----------------------------------------------------------
  'white vinegar': {
    benefits: ['Cuts grease', 'Dissolves mineral buildup', 'Kills odor-causing bacteria'],
    uses: ['grease', 'limescale', 'odor', 'glass', 'mildew'],
    surfacesAvoid: ['natural stone', 'granite', 'marble', 'unsealed wood', 'cast iron'],
    incompatibleWith: ['hydrogen peroxide', 'castile soap', 'bleach'],
    safetyNotes: ['Never mix with bleach — produces toxic chlorine gas'],
    categories: ['acid', 'cleaning'],
  },
  vinegar: {
    benefits: ['Cuts grease', 'Dissolves mineral buildup', 'Deodorizes'],
    uses: ['grease', 'odor', 'limescale', 'glass'],
    surfacesAvoid: ['natural stone', 'granite', 'marble'],
    incompatibleWith: ['hydrogen peroxide', 'castile soap', 'bleach'],
    safetyNotes: ['Never mix with bleach — produces toxic chlorine gas'],
    categories: ['acid', 'cleaning'],
  },
  'apple cider vinegar': {
    benefits: ['Milder than white vinegar', 'Antibacterial', 'Pleasant scent'],
    uses: ['rinse', 'odor', 'hair'],
    surfacesAvoid: ['natural stone'],
    incompatibleWith: ['hydrogen peroxide', 'castile soap'],
    categories: ['acid', 'beauty'],
  },
  'lemon juice': {
    benefits: ['Natural bleaching action', 'Brightens fabric', 'Pleasant citrus scent'],
    uses: ['stains', 'brightening', 'odor'],
    surfacesAvoid: ['natural stone'],
    categories: ['acid', 'cleaning', 'beauty'],
  },
  'citric acid': {
    benefits: ['Removes hard water stains', 'Descales appliances', 'Brightens whites'],
    uses: ['limescale', 'descaling', 'brightening'],
    surfacesAvoid: ['natural stone', 'aluminum'],
    categories: ['acid', 'cleaning'],
  },
  'lemon': {
    benefits: ['Natural antibacterial', 'Cuts grease', 'Brightens whites'],
    uses: ['grease', 'odor', 'brightening', 'stains'],
    surfacesAvoid: ['natural stone'],
    categories: ['acid', 'cleaning'],
  },
  'lemon peels': {
    benefits: ['Infuses cleaners with natural degreasing oils', 'Pleasant scent'],
    uses: ['grease', 'odor'],
    categories: ['acid', 'cleaning'],
  },

  // ---- Alkalis ---------------------------------------------------------
  'baking soda': {
    benefits: ['Deodorizes and lifts stains', 'Mild abrasive for scrubbing', 'Softens water'],
    uses: ['odor', 'stains', 'scrub', 'deodorize', 'whitening'],
    incompatibleWith: ['vinegar in storage'],
    safetyNotes: ['Combining with vinegar in a sealed container can build pressure — only mix in open vessels'],
    categories: ['alkali', 'cleaning', 'deodorizer'],
  },
  'washing soda': {
    benefits: ['Stronger alkaline degreaser', 'Boosts laundry brightness', 'Cuts oil and grime'],
    uses: ['grease', 'laundry', 'heavy-duty'],
    surfacesAvoid: ['aluminum', 'unsealed wood'],
    safetyNotes: ['Wear gloves — irritates skin on prolonged contact'],
    categories: ['alkali', 'cleaning'],
  },
  borax: {
    benefits: ['Boosts laundry detergent', 'Kills mold spores', 'Softens hard water'],
    uses: ['laundry', 'mold', 'heavy-duty'],
    safetyNotes: ['Keep away from children and pets', 'Wear gloves on prolonged contact'],
    categories: ['alkali', 'cleaning'],
  },
  'cream of tartar': {
    benefits: ['Gentle abrasive', 'Lifts rust and discoloration'],
    uses: ['scrub', 'rust', 'whitening'],
    categories: ['acid', 'cleaning'],
  },

  // ---- Soaps & surfactants --------------------------------------------
  'castile soap': {
    benefits: ['Plant-based all-purpose cleaner', 'Gentle on skin', 'Multi-surface safe'],
    uses: ['all-purpose', 'gentle', 'natural'],
    incompatibleWith: ['white vinegar', 'apple cider vinegar', 'lemon juice'],
    safetyNotes: ['Never mix with vinegar — they cancel each other out and create curdled mess'],
    categories: ['soap', 'cleaning'],
  },
  'dish soap': {
    benefits: ['Cuts grease quickly', 'Easy to find', 'Mild on hands'],
    uses: ['grease', 'all-purpose'],
    categories: ['soap', 'cleaning'],
  },
  'sal suds': {
    benefits: ['Stronger plant-based cleaner', 'Cuts grease aggressively'],
    uses: ['grease', 'heavy-duty'],
    safetyNotes: ['Dilute well — concentrated form can irritate skin'],
    categories: ['soap', 'cleaning'],
  },

  // ---- Solvents & alcohols -------------------------------------------
  'rubbing alcohol': {
    benefits: ['Disinfects surfaces', 'Evaporates streak-free', 'Kills germs on hard surfaces'],
    uses: ['glass', 'disinfect', 'electronics'],
    surfacesAvoid: ['painted finishes', 'leather'],
    safetyNotes: ['Highly flammable — never use near open flame', 'Ventilate the room'],
    categories: ['solvent', 'cleaning'],
  },
  'witch hazel': {
    benefits: ['Disperses essential oils evenly', 'Astringent for skin', 'Mild preservative'],
    uses: ['skin', 'preserve', 'spray'],
    categories: ['solvent', 'beauty'],
  },
  vodka: {
    benefits: ['Food-grade alcohol disperses oils cleanly', 'Pleasant clean scent'],
    uses: ['preserve', 'spray', 'fabric'],
    safetyNotes: ['Flammable — keep away from heat'],
    categories: ['solvent', 'beauty', 'home'],
  },

  // ---- Oxidizers -----------------------------------------------------
  'hydrogen peroxide': {
    benefits: ['Kills mold and mildew at the spore level', 'Brightens whites', 'Disinfects without residue'],
    uses: ['mold', 'whitening', 'disinfect'],
    incompatibleWith: ['white vinegar', 'apple cider vinegar', 'vinegar', 'lemon juice', 'castile soap'],
    safetyNotes: [
      'Never mix with vinegar — produces corrosive peracetic acid',
      'Store in a dark, opaque bottle — light degrades it',
      'Do not use on natural stone',
    ],
    surfacesAvoid: ['natural stone', 'colored fabric'],
    categories: ['oxidizer', 'cleaning'],
  },

  // ---- Carrier oils & fats -------------------------------------------
  'olive oil': {
    benefits: ['Conditions wood and leather', 'Polishes stainless', 'Moisturizes skin'],
    uses: ['polish', 'wood', 'skin', 'moisturize'],
    categories: ['oil', 'home', 'beauty'],
  },
  'coconut oil': {
    benefits: ['Solid-to-liquid texture for body care', 'Antibacterial properties', 'Deeply moisturizing'],
    uses: ['skin', 'hair', 'moisturize'],
    categories: ['oil', 'beauty'],
  },
  'jojoba oil': {
    benefits: ['Closest to skin sebum — non-comedogenic', 'Light absorption', 'Balances oily skin'],
    uses: ['skin', 'hair', 'sensitive'],
    categories: ['oil', 'beauty'],
  },
  'sweet almond oil': {
    benefits: ['Light, non-greasy carrier', 'Vitamin E rich', 'Gentle on sensitive skin'],
    uses: ['skin', 'sensitive', 'massage'],
    categories: ['oil', 'beauty'],
  },
  beeswax: {
    benefits: ['Natural emulsifier', 'Adds firmness to balms and creams', 'Protective barrier on skin'],
    uses: ['balm', 'wood', 'polish'],
    categories: ['wax', 'beauty', 'home'],
  },

  // ---- Essential oils -------------------------------------------------
  'tea tree oil': {
    benefits: ['Powerful antibacterial', 'Antifungal', 'Effective on mold and mildew'],
    uses: ['mold', 'antibacterial', 'disinfect'],
    safetyNotes: [
      'Toxic to cats and dogs — avoid pet exposure',
      'Always dilute before applying to skin',
    ],
    categories: ['essential-oil', 'antibacterial'],
  },
  'lavender oil': {
    benefits: ['Calming sleep-friendly scent', 'Mild antibacterial', 'Skin-soothing'],
    uses: ['scent', 'sleep', 'sensitive'],
    safetyNotes: ['Always dilute before applying to skin'],
    categories: ['essential-oil', 'beauty', 'home'],
  },
  'eucalyptus oil': {
    benefits: ['Strong antimicrobial', 'Clears nasal passages', 'Bug repellent'],
    uses: ['antibacterial', 'fresh'],
    safetyNotes: ['Toxic to cats and dogs', 'Not for use on or near babies under 2'],
    categories: ['essential-oil', 'antibacterial'],
  },
  'lemon essential oil': {
    benefits: ['Bright clean scent', 'Antibacterial', 'Cuts through grease'],
    uses: ['scent', 'grease', 'antibacterial'],
    categories: ['essential-oil', 'cleaning'],
  },
  'peppermint oil': {
    benefits: ['Cooling sensation', 'Repels pests', 'Energizing scent'],
    uses: ['scent', 'pest-repel'],
    safetyNotes: ['Toxic to cats', 'Not for use on babies under 2'],
    categories: ['essential-oil'],
  },
  'rosemary oil': {
    benefits: ['Earthy clarifying scent', 'Antimicrobial', 'Stimulates scalp'],
    uses: ['hair', 'scent', 'antibacterial'],
    safetyNotes: ['Avoid during pregnancy'],
    categories: ['essential-oil', 'hair'],
  },
  'chamomile oil': {
    benefits: ['Calming for sensitive skin', 'Sleep-promoting scent', 'Anti-inflammatory'],
    uses: ['sensitive', 'sleep', 'baby-safe'],
    categories: ['essential-oil', 'beauty'],
  },

  // ---- Sweeteners & humectants ---------------------------------------
  honey: {
    benefits: ['Natural humectant', 'Antibacterial', 'Soothes skin'],
    uses: ['skin', 'face', 'moisturize'],
    categories: ['humectant', 'beauty'],
  },
  sugar: {
    benefits: ['Natural exfoliator', 'Dissolves quickly in warm water', 'Pulls moisture into skin'],
    uses: ['scrub', 'exfoliate'],
    categories: ['exfoliant', 'beauty'],
  },
  glycerin: {
    benefits: ['Pulls moisture from the air into skin and hair', 'Helps fragrance linger', 'Vegan humectant'],
    uses: ['moisturize', 'fabric'],
    categories: ['humectant', 'beauty'],
  },

  // ---- Skin / soothing ------------------------------------------------
  'aloe vera': {
    benefits: ['Cools and soothes skin', 'Anti-inflammatory', 'Gentle on sunburn'],
    uses: ['skin', 'soothing', 'sensitive'],
    categories: ['humectant', 'beauty'],
  },
  'aloe vera gel': {
    benefits: ['Cools sunburn', 'Hydrates dry skin', 'Anti-inflammatory'],
    uses: ['skin', 'soothing', 'sensitive'],
    categories: ['humectant', 'beauty'],
  },
  oats: {
    benefits: ['Soothes irritated skin', 'Anti-itch', 'Gentle exfoliation'],
    uses: ['sensitive', 'skin', 'baby-safe'],
    categories: ['exfoliant', 'beauty'],
  },
  'ground oats': {
    benefits: ['Calms eczema and irritation', 'Soothes itching', 'Safe for sensitive skin'],
    uses: ['sensitive', 'skin', 'baby-safe'],
    categories: ['exfoliant', 'beauty'],
  },

  // ---- Salts ----------------------------------------------------------
  'epsom salt': {
    benefits: ['Releases magnesium for sore muscles', 'Reduces inflammation', 'Promotes relaxation'],
    uses: ['skin', 'soak', 'muscle'],
    categories: ['salt', 'beauty'],
  },
  'sea salt': {
    benefits: ['Mineral-rich exfoliant', 'Antimicrobial', 'Adds texture to scrubs'],
    uses: ['scrub', 'exfoliate'],
    categories: ['salt', 'beauty'],
  },
  salt: {
    benefits: ['Natural abrasive', 'Antimicrobial', 'Pulls moisture out of stains'],
    uses: ['scrub', 'stains'],
    categories: ['salt', 'cleaning'],
  },

  // ---- Starches & misc -----------------------------------------------
  cornstarch: {
    benefits: ['Thickens cleaners for stick-on application', 'Polishes glass streak-free', 'Absorbs grease'],
    uses: ['glass', 'absorb', 'thicken'],
    categories: ['starch'],
  },
  'arrowroot powder': {
    benefits: ['Plant-based thickener', 'Absorbs moisture', 'Smooth texture for body care'],
    uses: ['absorb', 'thicken'],
    categories: ['starch'],
  },
  'distilled water': {
    benefits: ['Mineral-free for stable mixes', 'Extends shelf life of homemade products'],
    uses: ['base', 'spray'],
    categories: ['water'],
  },
  water: {
    benefits: ['Universal solvent', 'Carries every other ingredient'],
    uses: ['base'],
    categories: ['water'],
  },
  'dried herbs': {
    benefits: ['Natural fragrance', 'Long-lasting scent', 'Decorative texture'],
    uses: ['scent'],
    categories: ['herb', 'home'],
  },
  gelatin: {
    benefits: ['Sets at room temperature', 'Holds essential oils in solid form'],
    uses: ['gel', 'thicken'],
    categories: ['protein'],
  },
};

// ---------- Lookup ----------------------------------------------------------

import { extractIngredientName } from './smart-swaps';

/** Get the intel block for an ingredient string. Returns null if no entry. */
export function getIngredientIntel(text: string): IngredientIntel | null {
  const name = extractIngredientName(text);
  if (!name) return null;
  if (INGREDIENT_INTEL[name]) return INGREDIENT_INTEL[name];
  // Substring fallback — "lavender essential oil" hits "lavender oil"
  for (const key of Object.keys(INGREDIENT_INTEL)) {
    if (name.includes(key) || key.includes(name)) return INGREDIENT_INTEL[key];
  }
  return null;
}

/** Map a recipe's ingredient list to the union of all `uses` tags so we can
 *  derive a Best For chip set without per-recipe authoring. */
export function bestForFromIngredients(ingredients: string[]): string[] {
  const tags = new Set<string>();
  for (const ing of ingredients) {
    const intel = getIngredientIntel(ing);
    if (!intel) continue;
    for (const u of intel.uses) tags.add(u);
  }
  return Array.from(tags);
}

/** Surface contexts the recipe should avoid based on its ingredients. */
export function avoidIfFromIngredients(ingredients: string[]): string[] {
  const surfaces = new Set<string>();
  for (const ing of ingredients) {
    const intel = getIngredientIntel(ing);
    if (!intel?.surfacesAvoid) continue;
    for (const s of intel.surfacesAvoid) surfaces.add(s);
  }
  return Array.from(surfaces);
}

/**
 * Derive Safety Tips from ingredient incompatibilities + per-ingredient
 * notes. We only flag an `incompatibleWith` warning when BOTH the ingredient
 * AND its incompatible partner are in the same recipe — otherwise the note
 * is irrelevant.
 */
export function safetyNotesFromIngredients(ingredients: string[]): string[] {
  const tips = new Set<string>();
  // Build a lowercased set of canonical ingredient names in this recipe.
  const present = new Set<string>();
  for (const ing of ingredients) {
    const name = extractIngredientName(ing);
    if (name) present.add(name);
  }

  for (const ing of ingredients) {
    const intel = getIngredientIntel(ing);
    if (!intel) continue;

    // Always include unconditional safety notes.
    if (intel.safetyNotes) {
      for (const note of intel.safetyNotes) tips.add(note);
    }

    // Conditional incompatibility — only fire if BOTH ingredients are in the
    // same recipe. (e.g. "vinegar + hydrogen peroxide" warning only fires
    // when both appear, not on every vinegar recipe.)
    if (intel.incompatibleWith) {
      for (const partner of intel.incompatibleWith) {
        for (const p of present) {
          if (p.includes(partner) || partner.includes(p)) {
            tips.add(
              `Do not mix ${capitalize(extractIngredientName(ing))} and ${capitalize(partner)} — keep them in separate steps`,
            );
          }
        }
      }
    }
  }
  return Array.from(tips);
}

/** Build a benefits map { ingredientName: oneLine } for the recipe detail. */
export function ingredientBenefitsFor(
  ingredients: string[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const ing of ingredients) {
    const intel = getIngredientIntel(ing);
    if (!intel?.benefits.length) continue;
    const name = extractIngredientName(ing);
    out[name] = intel.benefits[0];
  }
  return out;
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
