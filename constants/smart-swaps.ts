// Smart Swaps — per-ingredient alternatives shown in the recipe detail view.
//
// Why this exists:
//   The hero recipes (10 of them) ship with curated `substitutions` pairs
//   like `{ swap: 'Apple cider vinegar', for: 'White vinegar' }`. The 100
//   v3 catalog recipes don't carry any substitutions, so the Smart Swap
//   section was rendering blank for most of the catalog. This module
//   provides a recipe-agnostic ingredient → alternatives lookup that
//   works regardless of which catalog the recipe came from.
//
// Maintenance:
//   Keep keys lowercase + canonical. The matcher below normalizes recipe
//   strings (drops numbers, units, parens) before lookup. Adding a new
//   ingredient = one entry here, no other code changes.

export type SmartSwap = {
  /** Display name of the alternative ingredient. */
  name: string;
  /** Why someone would use this swap. Sentence case, no period. */
  reason: string;
  /** Substitution ratio (volume). "1:1" means same amount. */
  ratio: string;
  /** Optional tags so we can filter by user prefs later. */
  tags?: string[];
};

export const SMART_SWAPS: Record<string, SmartSwap[]> = {
  // ---- Salts & soaks -----------------------------------------------------
  'epsom salt': [
    { name: 'Sea salt', reason: 'Similar texture for soaking, more accessible', ratio: '1:1', tags: ['accessible'] },
    { name: 'Coarse sea salt', reason: 'Coarser exfoliation, gentler on skin', ratio: '1:1', tags: ['gentle'] },
    { name: 'Baking soda', reason: 'Softens water, gentler for sensitive skin', ratio: '1:1', tags: ['sensitive'] },
  ],
  'sea salt': [
    { name: 'Epsom salt', reason: 'Adds magnesium for sore muscles', ratio: '1:1' },
    { name: 'Pink himalayan salt', reason: 'Trace minerals + softer color', ratio: '1:1' },
    { name: 'Kosher salt', reason: 'Common pantry alternative', ratio: '1:1', tags: ['accessible'] },
  ],
  salt: [
    { name: 'Sea salt', reason: 'Cleaner mineral profile', ratio: '1:1' },
    { name: 'Epsom salt', reason: 'For relaxing soaks', ratio: '1:1' },
  ],

  // ---- Oils (essential) --------------------------------------------------
  'lavender oil': [
    { name: 'Chamomile oil', reason: 'Calmer, gentler floral note', ratio: '1:1', tags: ['sensitive', 'calming', 'baby-safe'] },
    { name: 'Eucalyptus oil', reason: 'More invigorating scent', ratio: '1:1', tags: ['energizing'] },
    { name: 'Bergamot oil', reason: 'Brighter citrus-floral lift', ratio: '1:1', tags: ['uplifting'] },
  ],
  'tea tree oil': [
    { name: 'Lemon essential oil', reason: 'Antibacterial with a brighter scent', ratio: '1:1', tags: ['pet-safer'] },
    { name: 'Eucalyptus oil', reason: 'Similar antimicrobial profile', ratio: '1:1' },
    { name: 'Rosemary oil', reason: 'Earthy + clarifying', ratio: '1:1' },
  ],
  'eucalyptus oil': [
    { name: 'Peppermint oil', reason: 'Sharper menthol kick', ratio: '1:1' },
    { name: 'Tea tree oil', reason: 'More antimicrobial, less cooling', ratio: '1:1' },
    { name: 'Rosemary oil', reason: 'Gentler herbal scent', ratio: '1:1', tags: ['gentle'] },
  ],
  'lemon essential oil': [
    { name: 'Sweet orange oil', reason: 'Sweeter citrus, less astringent', ratio: '1:1', tags: ['kid-friendly'] },
    { name: 'Grapefruit oil', reason: 'Bright with a hint of bitterness', ratio: '1:1' },
    { name: 'Bergamot oil', reason: 'Floral citrus, more refined', ratio: '1:1' },
  ],
  'lemon oil': [
    { name: 'Sweet orange oil', reason: 'Sweeter citrus, less astringent', ratio: '1:1', tags: ['kid-friendly'] },
    { name: 'Grapefruit oil', reason: 'Bright with a hint of bitterness', ratio: '1:1' },
  ],
  'rosemary oil': [
    { name: 'Eucalyptus oil', reason: 'Brisker, more antimicrobial', ratio: '1:1' },
    { name: 'Sage oil', reason: 'Earthier, similar herbal family', ratio: '1:1' },
  ],
  'peppermint oil': [
    { name: 'Spearmint oil', reason: 'Sweeter, less menthol punch', ratio: '1:1', tags: ['gentle'] },
    { name: 'Eucalyptus oil', reason: 'Cooling without the candy note', ratio: '1:1' },
  ],
  'chamomile oil': [
    { name: 'Lavender oil', reason: 'Similar calming profile, easier to find', ratio: '1:1', tags: ['accessible'] },
    { name: 'Bergamot oil', reason: 'Calming with a brighter top note', ratio: '1:1' },
  ],
  'orange peel oil': [
    { name: 'Sweet orange oil', reason: 'Same family, more concentrated', ratio: '1:1' },
    { name: 'Bergamot oil', reason: 'More floral citrus character', ratio: '1:1' },
  ],

  // ---- Carrier & cooking oils -------------------------------------------
  'coconut oil': [
    { name: 'Shea butter', reason: 'Heavier moisture, less greasy feel', ratio: '1:1', tags: ['dry-skin'] },
    { name: 'Olive oil', reason: 'Stays liquid in cool rooms', ratio: '1:1' },
    { name: 'Sweet almond oil', reason: 'Lighter on skin, fast absorbing', ratio: '1:1', tags: ['oily-skin'] },
  ],
  'olive oil': [
    { name: 'Sweet almond oil', reason: 'Lighter, less greasy', ratio: '1:1', tags: ['light'] },
    { name: 'Jojoba oil', reason: 'Closest to skin sebum', ratio: '1:1', tags: ['sensitive'] },
    { name: 'Coconut oil', reason: 'Solid at room temp for thicker formulas', ratio: '1:1' },
  ],
  'jojoba oil': [
    { name: 'Sweet almond oil', reason: 'Similar light texture', ratio: '1:1' },
    { name: 'Argan oil', reason: 'Richer, vitamin E packed', ratio: '1:1' },
  ],
  'castor oil': [
    { name: 'Olive oil', reason: 'Less viscous, easier to spread', ratio: '1:1' },
    { name: 'Argan oil', reason: 'Lighter, more luxurious feel', ratio: '1:1' },
  ],

  // ---- Acids / bases ----------------------------------------------------
  'white vinegar': [
    { name: 'Apple cider vinegar', reason: 'Milder smell, slightly less acidic', ratio: '1:1', tags: ['fragrance-friendly'] },
    { name: 'Citric acid solution', reason: 'Stronger acid, no scent', ratio: '1 tsp citric acid : 1 cup water', tags: ['unscented'] },
    { name: 'Lemon juice', reason: 'Natural alternative for short-term use', ratio: '1:1', tags: ['natural'] },
  ],
  vinegar: [
    { name: 'Apple cider vinegar', reason: 'Milder, fruitier scent', ratio: '1:1' },
    { name: 'Citric acid solution', reason: 'Stronger, scent-free', ratio: '1 tsp : 1 cup water' },
  ],
  'apple cider vinegar': [
    { name: 'White vinegar', reason: 'Stronger acid, more cleaning power', ratio: '1:1', tags: ['cleaning'] },
    { name: 'Lemon juice', reason: 'Brighter scent, similar acidity', ratio: '1:1' },
  ],
  'baking soda': [
    { name: 'Washing soda', reason: 'Stronger alkaline for tough cleaning', ratio: '1:2 (use half)', tags: ['heavy-duty'] },
    { name: 'Cream of tartar', reason: 'Gentler, ideal for delicate surfaces', ratio: '1:1', tags: ['gentle'] },
  ],
  'washing soda': [
    { name: 'Baking soda', reason: 'Gentler, easier to find', ratio: '2:1 (use double)', tags: ['accessible'] },
    { name: 'Borax', reason: 'Similar boost in laundry power', ratio: '1:1' },
  ],
  borax: [
    { name: 'Washing soda', reason: 'Less controversial, similar laundry punch', ratio: '1:1' },
    { name: 'Baking soda', reason: 'Gentler, easier to find', ratio: '2:1 (use double)' },
  ],

  // ---- Solvents & alcohols ----------------------------------------------
  'rubbing alcohol': [
    { name: 'Vodka', reason: 'Cleaner scent, food-grade', ratio: '1:1', tags: ['fragrance-friendly'] },
    { name: 'Witch hazel', reason: 'Gentler on skin and surfaces', ratio: '1:1', tags: ['gentle', 'skin-safe'] },
  ],
  'witch hazel': [
    { name: 'Vodka', reason: 'Higher alcohol content for stronger preservation', ratio: '1:1' },
    { name: 'Rubbing alcohol', reason: 'Stronger antimicrobial action', ratio: '1:1' },
    { name: 'Distilled water', reason: 'When the dispersing agent isn’t needed', ratio: '1:1', tags: ['mild'] },
  ],
  vodka: [
    { name: 'Witch hazel', reason: 'Gentler on skin', ratio: '1:1' },
    { name: 'Rubbing alcohol', reason: 'Stronger and cheaper', ratio: '1:1' },
  ],

  // ---- Soaps -------------------------------------------------------------
  'castile soap': [
    { name: 'Liquid dish soap (fragrance-free)', reason: 'More accessible, similar surfactant', ratio: '1:1', tags: ['accessible'] },
    { name: 'Sal suds', reason: 'Stronger cleaner, less skin-friendly', ratio: '1:2 (use half)', tags: ['heavy-duty'] },
  ],
  'dish soap': [
    { name: 'Castile soap', reason: 'Plant-based, gentler on hands', ratio: '1:1', tags: ['gentle', 'natural'] },
  ],

  // ---- Starches & thickeners -------------------------------------------
  cornstarch: [
    { name: 'Arrowroot powder', reason: 'Identical thickening, less processed', ratio: '1:1', tags: ['natural'] },
    { name: 'Tapioca starch', reason: 'Slightly glossier finish', ratio: '1:1' },
  ],
  'arrowroot powder': [
    { name: 'Cornstarch', reason: 'Easier to find, identical effect', ratio: '1:1' },
    { name: 'Tapioca starch', reason: 'Similar texture, glossier', ratio: '1:1' },
  ],

  // ---- Sweet / sugar -----------------------------------------------------
  sugar: [
    { name: 'Brown sugar', reason: 'Softer crystals, gentler scrub', ratio: '1:1', tags: ['gentle'] },
    { name: 'Coconut sugar', reason: 'Finer grind, mild caramel scent', ratio: '1:1' },
  ],
  'brown sugar': [
    { name: 'Coconut sugar', reason: 'Lower glycemic, similar moisture', ratio: '1:1' },
    { name: 'White sugar', reason: 'Cleaner crystals, sharper exfoliation', ratio: '1:1' },
  ],
  honey: [
    { name: 'Maple syrup', reason: 'Vegan alternative, similar viscosity', ratio: '1:1', tags: ['vegan'] },
    { name: 'Agave nectar', reason: 'Thinner, less sticky finish', ratio: '1:1' },
  ],

  // ---- Citrus -----------------------------------------------------------
  lemon: [
    { name: 'Lime', reason: 'Sharper acidity, similar citrus oils', ratio: '1:1' },
    { name: 'Lemon essential oil', reason: 'When you only need the scent', ratio: '1 lemon : 4 drops oil', tags: ['concentrated'] },
  ],
  'lemon peels': [
    { name: 'Orange peels', reason: 'Sweeter scent, same de-greasing oils', ratio: '1:1' },
    { name: 'Grapefruit peels', reason: 'Brighter, slightly bitter note', ratio: '1:1' },
  ],

  // ---- Misc --------------------------------------------------------------
  'shea butter': [
    { name: 'Cocoa butter', reason: 'Richer, with a soft chocolate note', ratio: '1:1' },
    { name: 'Mango butter', reason: 'Lighter, less greasy', ratio: '1:1', tags: ['light'] },
  ],
  'beeswax': [
    { name: 'Candelilla wax', reason: 'Vegan alternative, similar firmness', ratio: '1:1', tags: ['vegan'] },
    { name: 'Soy wax', reason: 'Softer, ideal for candles', ratio: '1:1' },
  ],
  'distilled water': [
    { name: 'Boiled tap water (cooled)', reason: 'When distilled isn’t available', ratio: '1:1', tags: ['accessible'] },
    { name: 'Filtered water', reason: 'Similar mineral content', ratio: '1:1' },
  ],
  glycerin: [
    { name: 'Honey', reason: 'Natural humectant, sticky finish', ratio: '1:1', tags: ['natural'] },
    { name: 'Aloe vera juice', reason: 'Lighter, more soothing', ratio: '1:1' },
  ],
  'aloe vera': [
    { name: 'Glycerin', reason: 'Better preservation, syrupy feel', ratio: '1:1' },
    { name: 'Cucumber juice', reason: 'Similar cooling effect', ratio: '1:1' },
  ],
};

// Common volume / mass units we strip when canonicalizing an ingredient name.
const UNIT_RE =
  /\b(cups?|cup|tablespoons?|tbsp|teaspoons?|tsp|drops?|ounces?|oz|fluid\s*ounces?|fl\s*oz|milliliters?|ml|liters?|l|grams?|g|kilograms?|kg|pounds?|lbs?|pinch(?:es)?|dash(?:es)?|handful)\b/gi;
// Leading number forms (longest match first):
//   "1 1/2"    mixed ascii fraction
//   "1 ½"      mixed unicode fraction
//   "1/2"      bare ascii fraction
//   "1.5"      decimal
//   "10"       integer
//   "½"        bare unicode fraction
const LEADING_NUMBER_RE =
  /^\s*(\d+\s+\d+\/\d+|\d+\s*[¼½¾⅓⅔⅛⅜⅝⅞]|\d+\/\d+|\d+(?:\.\d+)?|[¼½¾⅓⅔⅛⅜⅝⅞])\s*/i;
// Filler words: "from", "about", "approximately", "of"
const FILLER_RE = /\b(from|about|approx\.?|approximately|over|of)\b/gi;

/**
 * Strip quantities, units, parens, and filler words to get a canonical
 * ingredient name suitable for SMART_SWAPS lookup.
 *
 * "2 cups epsom salt"          → "epsom salt"
 * "20 drops lavender oil"      → "lavender oil"
 * "1 ½ cups distilled water"   → "distilled water"
 * "from 2 lemons"              → "lemons"
 * "Citrus aurantium dulcis"    → "citrus aurantium dulcis" (no swap, returns [])
 */
export function extractIngredientName(text: string): string {
  return (
    text
      // Strip a leading number (handles whole / decimal / fraction / mixed / unicode)
      .replace(LEADING_NUMBER_RE, '')
      // Strip parenthetical scientific names: "(Citrus aurantium dulcis)"
      .replace(/\([^)]*\)/g, '')
      // Strip units
      .replace(UNIT_RE, '')
      // Strip filler words
      .replace(FILLER_RE, '')
      // Collapse whitespace
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
  );
}

/** Look up Smart Swaps for any recipe ingredient string. Returns [] if no
 *  entry exists for that ingredient. */
export function getSmartSwaps(ingredientText: string): SmartSwap[] {
  const name = extractIngredientName(ingredientText);
  if (!name) return [];
  // Direct hit
  if (SMART_SWAPS[name]) return SMART_SWAPS[name];
  // Substring fallback — "lavender essential oil" hits "lavender oil"
  for (const key of Object.keys(SMART_SWAPS)) {
    if (name.includes(key) || key.includes(name)) return SMART_SWAPS[key];
  }
  return [];
}

/** Convenience: returns whether any swap exists for this ingredient. */
export function hasSmartSwaps(ingredientText: string): boolean {
  return getSmartSwaps(ingredientText).length > 0;
}
