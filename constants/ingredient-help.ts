// Ingredient education layer — everything a beginner needs to recognize,
// source, and use a less-familiar DIY ingredient. Only entries that genuinely
// teach something show up: water and salt are skipped on purpose.
//
// Future-ready: optional fields below (regions, substitutes, allergyWarnings,
// whyItWorks, videoUrl) are intentional so we can extend without changing
// every call site.

export type IngredientHelp = {
  title: string;
  what: string;
  where: string[];
  bestOptions?: string[];
  tips?: string[];
  // Reserved for upcoming features — safe to add now, render later.
  substitutes?: string[];
  regions?: Record<string, string[]>; // e.g. { PT: ['Continente', 'Celeiro'] }
  allergyWarnings?: string[];
  whyItWorks?: string;
  videoUrl?: string;
};

// Canonical keys are the matchable terms we look for inside an ingredient
// string after lowercasing + stripping quantities. Order matters slightly —
// the matcher uses the first key that appears in the text, so put more
// specific keys (e.g. "lavender essential oil") before generic ones
// ("essential oil"). The KEY_ORDER export at the bottom enforces that.
const HELP: Record<string, IngredientHelp> = {
  'castile soap': {
    title: 'Castile Soap',
    what: 'Plant-based liquid soap (usually olive- or coconut-derived). The most versatile base in natural cleaners and gentle body products.',
    where: ['Health stores', 'Beauty stores', 'Continente', 'Amazon'],
    bestOptions: ['Dr. Bronner’s Pure-Castile (unscented)', 'Sky Organics Castile'],
    tips: [
      'Don’t mix directly with vinegar — they cancel each other out.',
      'Use unscented for baby-safe recipes.',
    ],
    whyItWorks: 'Castile soap suspends grease and lifts dirt without harsh surfactants.',
  },

  'grated soap': {
    title: 'Grated Soap',
    what: 'A bar of soap shredded into fine flakes so it dissolves into laundry detergents and cleaners.',
    where: ['Laundry aisle', 'Natural stores', 'Amazon', 'Or grate any plain bar with a cheese grater'],
    bestOptions: [
      'Castile soap bars',
      'Unscented laundry bars (Fels-Naptha, Sabão Macaco)',
      'Sensitive-skin bars',
    ],
    tips: ['Avoid heavily perfumed bars when making baby-safe detergent.'],
  },

  'washing soda': {
    title: 'Washing Soda',
    what: 'Sodium carbonate — a stronger sibling of baking soda used for laundry boosting, degreasing, and water softening.',
    where: ['Laundry aisle', 'Hardware stores', 'Amazon'],
    tips: [
      'Not the same as baking soda — much more alkaline.',
      'Wear gloves; it can dry out skin.',
    ],
    allergyWarnings: ['Skin and eye irritant — do not inhale powder.'],
  },

  'baking soda': {
    title: 'Baking Soda',
    what: 'Mild, food-safe alkaline powder. Pulls double duty as a gentle scrub, deodorizer, and pH balancer.',
    where: ['Baking aisle of any grocery store'],
    tips: [
      'Combined with vinegar it fizzes briefly, then both neutralize — use them in sequence, not together.',
      'Keep dry; it clumps with humidity.',
    ],
  },

  'citric acid': {
    title: 'Citric Acid',
    what: 'Powdered natural acid extracted from citrus fruits. Powers fizzing tablets and dissolves hard-water deposits.',
    where: ['Baking aisle', 'Brewing supply', 'Amazon'],
    tips: ['Store dry and sealed.', 'Avoid eye and respiratory contact when handling powder.'],
    allergyWarnings: ['Mild irritant — keep off broken skin.'],
  },

  'white vinegar': {
    title: 'White Vinegar',
    what: 'Distilled vinegar — the workhorse of natural cleaning. Cuts mineral deposits and disinfects mild surfaces.',
    where: ['Grocery aisle (any brand)'],
    tips: [
      'Never mix with bleach — produces toxic fumes.',
      'Skip on natural stone (granite, marble) — vinegar etches.',
    ],
  },

  'apple cider vinegar': {
    title: 'Apple Cider Vinegar',
    what: 'Vinegar fermented from apple juice. Slightly milder than white vinegar; common substitute in natural recipes.',
    where: ['Grocery aisle', 'Health stores'],
    tips: ['Use raw / with the mother for the most active formulas.'],
  },

  'witch hazel': {
    title: 'Witch Hazel',
    what: 'Plant extract used in mists and skincare as a gentle astringent. Helps disperse essential oils into water.',
    where: ['Pharmacy', 'Beauty aisle', 'Amazon'],
    tips: ['Alcohol-free versions are gentler on skin.'],
    substitutes: ['Vodka (1:1)', 'Distilled water (less effective at dispersing oils)'],
  },

  'rubbing alcohol': {
    title: 'Rubbing Alcohol',
    what: 'Isopropyl alcohol (typically 70 %) — used to streak-prevent on glass and to flash-dry surfaces.',
    where: ['Pharmacy aisle'],
    allergyWarnings: ['Flammable — keep away from open flame.'],
    substitutes: ['Vodka'],
  },

  'vegetable glycerin': {
    title: 'Vegetable Glycerin',
    what: 'Clear, sweet, plant-derived liquid that helps formulas hold scent and stay soft.',
    where: ['Health stores', 'Soap-making suppliers', 'Amazon'],
    tips: ['A little goes a long way — typically ½ tsp per spray bottle.'],
  },

  'cornstarch': {
    title: 'Cornstarch',
    what: 'Fine starch powder. Used in glass cleaners as an anti-streak agent and in dry shampoos to absorb oil.',
    where: ['Baking aisle'],
    tips: ['Shake any cornstarch-based spray well before each use — it settles fast.'],
    substitutes: ['Arrowroot powder'],
  },

  'arrowroot powder': {
    title: 'Arrowroot Powder',
    what: 'Soft, ultra-fine starch from the arrowroot plant. Lighter than cornstarch — preferred for body products.',
    where: ['Baking aisle (specialty)', 'Health stores', 'Amazon'],
    tips: ['Great for dry shampoo on light hair; mix with cocoa for darker hair.'],
    substitutes: ['Cornstarch (slightly heavier feel)'],
  },

  'coconut oil': {
    title: 'Coconut Oil',
    what: 'Solid below 76 °F / 24 °C, melts to a clear liquid. Carrier oil for scrubs, balms, and butters.',
    where: ['Baking aisle', 'Beauty stores'],
    tips: [
      'Solid in winter, liquid in summer — this is normal.',
      'Patch-test if nut-allergic.',
    ],
    substitutes: ['Sweet almond oil', 'Jojoba oil'],
  },

  'shea butter': {
    title: 'Shea Butter',
    what: 'Rich plant butter from the African shea tree. The base of most luxurious whipped body butters.',
    where: ['Beauty supply', 'Health stores', 'Soap-making suppliers'],
    bestOptions: ['Raw, unrefined shea (yellow tone) — most nutrients'],
    tips: ['Whip with a hand mixer for that cloud-like texture.'],
  },

  'cocoa butter': {
    title: 'Cocoa Butter',
    what: 'Solid butter pressed from cocoa beans. Gives body products a faint chocolate scent and firm structure.',
    where: ['Beauty supply', 'Baking aisle (food-grade)', 'Soap-making suppliers'],
    substitutes: ['Mango butter (lighter)', 'Shea butter (richer)'],
  },

  'sweet almond oil': {
    title: 'Sweet Almond Oil',
    what: 'Light, nearly scentless carrier oil. Absorbs cleanly and is great for body oils and lotions.',
    where: ['Beauty supply', 'Health stores'],
    allergyWarnings: ['Tree-nut allergy: avoid.'],
    substitutes: ['Fractionated coconut oil', 'Jojoba oil'],
  },

  'jojoba oil': {
    title: 'Jojoba Oil',
    what: 'Technically a liquid wax — closest match to your skin’s natural oils. Long shelf life.',
    where: ['Beauty supply', 'Health stores'],
    tips: ['Doesn’t go rancid as quickly as nut oils — great for shelf-stable formulas.'],
  },

  'castor oil': {
    title: 'Castor Oil',
    what: 'Thick, glossy oil pressed from castor beans. Heavy enough to seal moisture; common in hair growth blends.',
    where: ['Pharmacy', 'Health stores'],
    tips: ['Mix 1:1 with a lighter oil so it spreads.'],
  },

  'argan oil': {
    title: 'Argan Oil',
    what: 'Light Moroccan tree-nut oil. Beloved in shine serums and curl care for its weightless feel.',
    where: ['Beauty stores', 'Health stores'],
    bestOptions: ['100 % pure cold-pressed argan'],
  },

  beeswax: {
    title: 'Beeswax',
    what: 'Natural wax that thickens balms and lip products. Comes as pellets or shaved bars.',
    where: ['Beauty supply', 'Health stores', 'Honey farms'],
    tips: ['Pellets melt faster than blocks.'],
    substitutes: ['Candelilla wax (vegan)'],
    allergyWarnings: ['Skip if propolis-allergic.'],
  },

  'soy wax': {
    title: 'Soy Wax',
    what: 'Plant-based candle wax (made from soybean oil). Burns cleaner and cooler than paraffin.',
    where: ['Craft stores', 'Soap & candle suppliers'],
    bestOptions: ['Golden Wax 464 — the candle-maker default'],
  },

  'fragrance oil': {
    title: 'Fragrance Oil',
    what: 'Synthetic or blended scent designed to hold up under heat (great for candles & melts).',
    where: ['Candle/soap supply'],
    tips: ['Choose phthalate-free fragrance oils for cleaner burn.'],
    substitutes: ['Essential oil blend (more delicate at heat)'],
  },

  'essential oil': {
    title: 'Essential Oils',
    what: 'Concentrated plant aromatics. A few drops scent and lightly preserve a recipe.',
    where: ['Health stores', 'Online specialty (Plant Therapy, Eden’s Garden)'],
    tips: [
      'Patch-test before using on skin.',
      'Some oils (eucalyptus, tea tree) can be unsafe for cats — research before nebulizing in pet areas.',
      'Use a glass spray bottle — citrus oils degrade plastic.',
    ],
    allergyWarnings: ['Skip undiluted application on broken skin.'],
  },

  'tea tree oil': {
    title: 'Tea Tree Oil',
    what: 'Antimicrobial essential oil from Australian Melaleuca. A go-to in bathroom and surface cleaners.',
    where: ['Pharmacy', 'Health stores'],
    allergyWarnings: ['Toxic to cats — avoid in cat areas.'],
  },

  'lavender essential oil': {
    title: 'Lavender Essential Oil',
    what: 'Calming floral oil — the most-used scent in linen sprays, bath products, and night routines.',
    where: ['Health stores', 'Online'],
    bestOptions: ['Bulgarian or French lavender for the cleanest scent'],
  },

  'lemon essential oil': {
    title: 'Lemon Essential Oil',
    what: 'Bright citrus oil that boosts cleaners and lifts grease.',
    where: ['Health stores', 'Online'],
    allergyWarnings: ['Photosensitive — avoid sun exposure right after applying to skin.'],
  },

  'eucalyptus essential oil': {
    title: 'Eucalyptus Oil',
    what: 'Sharp, camphor-like oil used in shower steamers, sinus blends, and surface cleaners.',
    where: ['Health stores', 'Online'],
    allergyWarnings: ['Toxic to cats and small pets — avoid in pet zones.'],
  },

  'aloe vera gel': {
    title: 'Aloe Vera Gel',
    what: 'Cooling plant gel pressed from aloe leaves. Soothes skin and adds slip to hair products.',
    where: ['Pharmacy', 'Health stores'],
    bestOptions: ['Pure aloe gel (no thickeners or alcohol)'],
  },

  'aloe gel': {
    title: 'Aloe Vera Gel',
    what: 'Cooling plant gel pressed from aloe leaves. Soothes skin and adds slip to hair products.',
    where: ['Pharmacy', 'Health stores'],
    bestOptions: ['Pure aloe gel (no thickeners or alcohol)'],
  },

  'epsom salt': {
    title: 'Epsom Salt',
    what: 'Magnesium sulfate — a soothing soak for muscles and a mineral booster in laundry crystals.',
    where: ['Pharmacy', 'Health stores'],
  },

  'vitamin e oil': {
    title: 'Vitamin E Oil',
    what: 'Skin-loving antioxidant oil. Extends the shelf life of your DIY oil blends.',
    where: ['Pharmacy', 'Health stores'],
    tips: ['Just ¼–½ tsp goes a long way.'],
  },

  'zinc oxide': {
    title: 'Zinc Oxide',
    what: 'Soft white mineral powder used in diaper-rash balms and gentle sun barriers.',
    where: ['Pharmacy', 'Soap-making suppliers'],
    tips: ['Wear a mask when handling powder — don’t inhale.'],
  },

  'bentonite clay': {
    title: 'Bentonite Clay',
    what: 'Volcanic-ash clay that draws out impurities. Star ingredient of detoxifying face masks.',
    where: ['Health stores', 'Beauty supply', 'Amazon'],
    tips: ['Mix with non-metal spoon — metal blunts its charge.'],
  },

  rosewater: {
    title: 'Rosewater',
    what: 'Distilled water from rose petals. A gentle, classic toner that calms skin.',
    where: ['Pharmacy (Middle Eastern foods aisle)', 'Beauty stores'],
    bestOptions: ['100 % pure (no added preservatives or alcohol)'],
  },

  glycerin: {
    title: 'Glycerin',
    what: 'Clear, sweet humectant — pulls moisture into skin and hair. Same as vegetable glycerin.',
    where: ['Pharmacy', 'Soap-making suppliers'],
  },
};

// Match longest / most specific keys first.
const KEY_ORDER = Object.keys(HELP).sort((a, b) => b.length - a.length);

// Strip "1 cup", "1/2 tbsp", "10 drops", trailing parentheticals — anything
// that isn't the ingredient itself. Returns lowercase string for matching.
function normalize(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ') // remove parentheticals
    .replace(/[\d/.¼-¾⅐-⅞]+\s*(?:cup|cups|tbsp|tsp|drop|drops|oz|ounces?|gallon|lb|pound|tablespoons?|teaspoons?|gram|grams?|ml|liters?|pinch|dash|bar|bars?|sprig|jar|sheet|sheets?)?/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function findIngredientHelp(rawIngredient: string): IngredientHelp | undefined {
  if (!rawIngredient) return undefined;
  const text = normalize(rawIngredient);
  for (const key of KEY_ORDER) {
    if (text.includes(key)) return HELP[key];
  }
  return undefined;
}

export function hasIngredientHelp(rawIngredient: string): boolean {
  return findIngredientHelp(rawIngredient) != null;
}
