export type ProductGroup = 'cleaning' | 'beauty' | 'home';

export type Product = {
  id: string;
  title: string;
  group: ProductGroup;
  emoji: string;
  swatch: string;
  accent: string;
  time: string;
  savingsUsd: number;
  storeBoughtUsd: number;
  tags: string[];
  blurb: string;
};

export const PRODUCTS: Product[] = [
  { id: 'bathroom-cleaner', title: 'Bathroom Cleaner', group: 'cleaning', emoji: '🛁', swatch: '#E4EDE5', accent: '#5C7F6B', time: '4 min', savingsUsd: 3.20, storeBoughtUsd: 5.99, tags: ['Baby-safe', 'Pet-safe'], blurb: 'A gentle daily-use spray that lifts soap scum without harsh fumes.' },
  { id: 'glass-cleaner', title: 'Glass Cleaner', group: 'cleaning', emoji: '🪟', swatch: '#EAF1F4', accent: '#4F7186', time: '3 min', savingsUsd: 2.40, storeBoughtUsd: 4.49, tags: ['Streak-free'], blurb: 'Crystal-clear windows and mirrors with no streaks or chemical haze.' },
  { id: 'kitchen-spray', title: 'Kitchen Spray', group: 'cleaning', emoji: '🍋', swatch: '#F7F2E7', accent: '#9C7A4F', time: '4 min', savingsUsd: 3.80, storeBoughtUsd: 6.49, tags: ['Citrus'], blurb: 'A bright citrus degreaser that cuts through everyday kitchen grime.' },
  { id: 'floor-cleaner', title: 'Floor Cleaner', group: 'cleaning', emoji: '🧺', swatch: '#F2EFE7', accent: '#6B7872', time: '5 min', savingsUsd: 4.10, storeBoughtUsd: 7.20, tags: ['Pet-safe'], blurb: 'Pet-friendly all-floor cleaner that leaves a soft natural finish.' },
  { id: 'laundry-booster', title: 'Laundry Booster', group: 'cleaning', emoji: '🧼', swatch: '#EFE7D2', accent: '#7C5C2E', time: '2 min', savingsUsd: 2.80, storeBoughtUsd: 5.10, tags: ['Fragrance-free'], blurb: 'Brightens whites and softens fabrics — no synthetic fragrance.' },
  { id: 'room-spray', title: 'Room Spray', group: 'cleaning', emoji: '🌬️', swatch: '#E8E5F0', accent: '#6F5FA3', time: '3 min', savingsUsd: 5.20, storeBoughtUsd: 8.99, tags: ['Calming'], blurb: 'A botanical mist that resets a room in seconds — calm, never cloying.' },
  { id: 'sugar-scrub', title: 'Sugar Scrub', group: 'beauty', emoji: '🍯', swatch: '#F7E7DC', accent: '#B86F44', time: '6 min', savingsUsd: 8.50, storeBoughtUsd: 14.00, tags: ['Glow'], blurb: 'A buttery sugar polish that softens skin and smells like dessert.' },
  { id: 'body-butter', title: 'Body Butter', group: 'beauty', emoji: '🧴', swatch: '#F4E9DA', accent: '#A2773A', time: '8 min', savingsUsd: 11.00, storeBoughtUsd: 18.00, tags: ['Whipped'], blurb: 'Whipped shea & cocoa butter that melts into thirsty skin.' },
  { id: 'candle', title: 'Soy Candle', group: 'home', emoji: '🕯️', swatch: '#F2EAD8', accent: '#8B6A2F', time: '12 min', savingsUsd: 14.00, storeBoughtUsd: 24.00, tags: ['Cozy'], blurb: 'Hand-poured soy with cotton wick — slow, even, all-evening burn.' },
  { id: 'linen-spray', title: 'Linen Mist', group: 'home', emoji: '🌿', swatch: '#E4EDE5', accent: '#5C7F6B', time: '4 min', savingsUsd: 5.10, storeBoughtUsd: 9.50, tags: ['Lavender'], blurb: 'Lavender + chamomile mist — sleep-friendly and grandma-approved.' },
];

export const PRODUCT_GROUPS: { key: ProductGroup; label: string; caption: string }[] = [
  { key: 'cleaning', label: 'Cleaning', caption: 'Sprays, scrubs & soaks' },
  { key: 'beauty', label: 'Beauty', caption: 'Body, bath & glow' },
  { key: 'home', label: 'Home', caption: 'Candles & linen mist' },
];

export function findProduct(id: string | undefined): Product {
  return PRODUCTS.find((p) => p.id === id) ?? PRODUCTS[0];
}

export type Ingredient = {
  name: string;
  amount: string;
  haveIt?: boolean;
  storePriceUsd?: number;
};

export type Recipe = {
  productId: string;
  title: string;
  blurb: string;
  ingredients: Ingredient[];
  steps: string[];
  warnings: string[];
  substitutions: { swap: string; for: string }[];
};

export const RECIPES: Record<string, Recipe> = {
  'bathroom-cleaner': {
    productId: 'bathroom-cleaner',
    title: 'Gentle Bathroom Cleaner',
    blurb: 'A daily-use spray that lifts soap scum without harsh fumes.',
    ingredients: [
      { name: 'Distilled water', amount: '1 ½ cups', haveIt: true, storePriceUsd: 0.30 },
      { name: 'Castile soap', amount: '2 tbsp', storePriceUsd: 1.20 },
      { name: 'Baking soda', amount: '1 tbsp', haveIt: true, storePriceUsd: 0.10 },
      { name: 'White vinegar', amount: '½ cup', haveIt: true, storePriceUsd: 0.20 },
      { name: 'Tea tree oil', amount: '8 drops', storePriceUsd: 0.80 },
      { name: 'Lavender oil', amount: '6 drops', storePriceUsd: 0.60 },
    ],
    steps: [
      'Pour distilled water and white vinegar into a clean spray bottle.',
      'Add castile soap and gently swirl — do not shake hard.',
      'Sprinkle baking soda in, then close and rotate to combine.',
      'Add tea tree and lavender oils.',
      'Label the bottle with the date and store under the sink.',
    ],
    warnings: [
      'Avoid mixing with bleach-based cleaners.',
      'Keep out of reach of children and pets while in use.',
      'Test on a small area before applying to natural stone.',
    ],
    substitutions: [
      { swap: 'Lemon essential oil', for: 'Tea tree oil' },
      { swap: 'Apple cider vinegar', for: 'White vinegar' },
    ],
  },

  'glass-cleaner': {
    productId: 'glass-cleaner',
    title: 'Citrus Glass Spray',
    blurb: 'Streak-free shine for windows and mirrors with a fresh citrus lift.',
    ingredients: [
      { name: 'Distilled water', amount: '1 cup', haveIt: true, storePriceUsd: 0.20 },
      { name: 'White vinegar', amount: '1 cup', haveIt: true, storePriceUsd: 0.40 },
      { name: 'Rubbing alcohol', amount: '¼ cup', storePriceUsd: 0.90 },
      { name: 'Cornstarch', amount: '1 tsp', haveIt: true, storePriceUsd: 0.05 },
      { name: 'Lemon essential oil', amount: '6 drops', storePriceUsd: 0.70 },
    ],
    steps: [
      'Combine water, vinegar, and rubbing alcohol in a spray bottle.',
      'Add cornstarch and shake until fully dissolved.',
      'Add lemon oil and swirl gently to combine.',
      'Spray onto glass and wipe with a microfiber cloth in straight lines.',
      'Buff dry with a second clean cloth for a streak-free finish.',
    ],
    warnings: [
      'Shake well before each use — cornstarch settles.',
      'Do not use on tinted windows or antique leaded glass.',
      'Keep away from open flame — alcohol is flammable.',
    ],
    substitutions: [
      { swap: 'Vodka', for: 'Rubbing alcohol' },
      { swap: 'Sweet orange oil', for: 'Lemon essential oil' },
    ],
  },

  'kitchen-spray': {
    productId: 'kitchen-spray',
    title: 'Citrus Kitchen Degreaser',
    blurb: 'A bright daily spray that cuts grease and freshens countertops.',
    ingredients: [
      { name: 'White vinegar', amount: '1 cup', haveIt: true, storePriceUsd: 0.40 },
      { name: 'Distilled water', amount: '1 cup', haveIt: true, storePriceUsd: 0.20 },
      { name: 'Lemon peels', amount: 'from 2 lemons', haveIt: true, storePriceUsd: 1.00 },
      { name: 'Castile soap', amount: '1 tbsp', storePriceUsd: 0.80 },
      { name: 'Sweet orange oil', amount: '10 drops', storePriceUsd: 0.90 },
    ],
    steps: [
      'Pack lemon peels into a clean glass jar and cover with vinegar.',
      'Seal and let infuse for 7 days in a dark cabinet (or skip for quick version).',
      'Strain the lemon vinegar into a spray bottle.',
      'Add distilled water, castile soap, and orange oil.',
      'Swirl gently and label. Spray, let sit 30 seconds, wipe with a damp cloth.',
    ],
    warnings: [
      'Do not use on natural stone (granite, marble) — vinegar etches.',
      'Test on a hidden spot of any sealed wood surface first.',
      'Avoid mixing with bleach-based cleaners.',
    ],
    substitutions: [
      { swap: 'Orange peels', for: 'Lemon peels' },
      { swap: 'Lemon essential oil', for: 'Sweet orange oil' },
    ],
  },

  'floor-cleaner': {
    productId: 'floor-cleaner',
    title: 'Pet-Friendly Floor Wash',
    blurb: 'A gentle all-floor cleaner that leaves a soft natural finish — paw-safe.',
    ingredients: [
      { name: 'Warm water', amount: '1 gallon', haveIt: true, storePriceUsd: 0.10 },
      { name: 'Castile soap', amount: '¼ cup', storePriceUsd: 1.60 },
      { name: 'White vinegar', amount: '½ cup', haveIt: true, storePriceUsd: 0.20 },
      { name: 'Baking soda', amount: '2 tbsp', haveIt: true, storePriceUsd: 0.15 },
      { name: 'Lemon essential oil', amount: '15 drops', storePriceUsd: 1.20 },
    ],
    steps: [
      'Fill a clean bucket with one gallon of warm water.',
      'Stir in castile soap until evenly combined.',
      'Add vinegar slowly, then sprinkle in baking soda (it will fizz briefly).',
      'Drop in lemon oil and stir.',
      'Mop in sections, rinsing the mop head between rooms. Air dry.',
    ],
    warnings: [
      'Not for unsealed wood, marble, or travertine — vinegar will damage.',
      'Wait until floors are fully dry before pets walk on them.',
      'Do not mix with bleach.',
    ],
    substitutions: [
      { swap: 'Lavender essential oil', for: 'Lemon essential oil' },
      { swap: 'Liquid Sal Suds', for: 'Castile soap' },
    ],
  },

  'laundry-booster': {
    productId: 'laundry-booster',
    title: 'Fragrance-Free Laundry Booster',
    blurb: 'Brightens whites, softens fabric, and skips synthetic fragrances entirely.',
    ingredients: [
      { name: 'Baking soda', amount: '1 cup', haveIt: true, storePriceUsd: 0.30 },
      { name: 'Washing soda', amount: '1 cup', storePriceUsd: 1.10 },
      { name: 'Coarse sea salt', amount: '½ cup', haveIt: true, storePriceUsd: 0.50 },
      { name: 'Citric acid', amount: '¼ cup', storePriceUsd: 0.90 },
    ],
    steps: [
      'Combine baking soda, washing soda, and sea salt in a large bowl.',
      'Add citric acid and whisk until fully blended.',
      'Transfer to a sealed glass jar — moisture will clump it.',
      'Add 2 tablespoons per regular load, alongside your usual detergent.',
      'For whites, add an extra tablespoon to the rinse cycle.',
    ],
    warnings: [
      'Wear gloves — washing soda can irritate skin.',
      'Keep dry; clumping ruins the mix.',
      'Not safe for wool or silk — stick to cottons & synthetics.',
    ],
    substitutions: [
      { swap: 'Borax', for: 'Citric acid' },
      { swap: 'Epsom salt', for: 'Coarse sea salt' },
    ],
  },

  'room-spray': {
    productId: 'room-spray',
    title: 'Calming Botanical Room Mist',
    blurb: 'A botanical mist that resets a room in seconds — calm, never cloying.',
    ingredients: [
      { name: 'Distilled water', amount: '¾ cup', haveIt: true, storePriceUsd: 0.15 },
      { name: 'Witch hazel', amount: '¼ cup', storePriceUsd: 1.40 },
      { name: 'Lavender essential oil', amount: '20 drops', storePriceUsd: 1.30 },
      { name: 'Eucalyptus essential oil', amount: '10 drops', storePriceUsd: 0.90 },
      { name: 'Cedarwood essential oil', amount: '6 drops', storePriceUsd: 0.70 },
    ],
    steps: [
      'Pour witch hazel into a 4 oz glass spray bottle.',
      'Add all essential oils and swirl gently for 10 seconds.',
      'Top off with distilled water, leaving a half-inch at the top.',
      'Cap and shake well. Let rest for 1 hour before first use.',
      'Shake before each spray — mist toward the ceiling, never directly on fabric.',
    ],
    warnings: [
      'Eucalyptus & cedarwood can be unsafe for cats — avoid in cat areas.',
      'Spot-test on furniture; oils can stain light fabrics.',
      'Store in a cool, dark place — UV degrades essential oils.',
    ],
    substitutions: [
      { swap: 'Vodka', for: 'Witch hazel' },
      { swap: 'Bergamot essential oil', for: 'Cedarwood essential oil' },
    ],
  },

  'sugar-scrub': {
    productId: 'sugar-scrub',
    title: 'Honey Vanilla Sugar Scrub',
    blurb: 'A buttery sugar polish that softens skin and smells like dessert.',
    ingredients: [
      { name: 'Granulated sugar', amount: '1 cup', haveIt: true, storePriceUsd: 0.40 },
      { name: 'Coconut oil', amount: '½ cup, melted', storePriceUsd: 1.80 },
      { name: 'Raw honey', amount: '2 tbsp', haveIt: true, storePriceUsd: 0.90 },
      { name: 'Vanilla extract', amount: '1 tsp', haveIt: true, storePriceUsd: 0.40 },
      { name: 'Vitamin E oil', amount: '½ tsp', storePriceUsd: 0.50 },
    ],
    steps: [
      'Gently melt coconut oil until just liquid — not hot.',
      'In a bowl, combine sugar and melted coconut oil; stir until coated.',
      'Add honey, vanilla, and vitamin E oil. Mix until smooth.',
      'Spoon into a clean jar with a tight lid.',
      'In the shower, scoop a small amount, massage in circles, rinse with warm water.',
    ],
    warnings: [
      'Floors and tubs get slippery — rinse and wipe after use.',
      'Patch-test on the inner forearm before full-body use.',
      'Avoid on broken or sunburned skin.',
    ],
    substitutions: [
      { swap: 'Brown sugar', for: 'Granulated sugar' },
      { swap: 'Sweet almond oil', for: 'Coconut oil' },
    ],
  },

  'body-butter': {
    productId: 'body-butter',
    title: 'Whipped Shea Body Butter',
    blurb: 'Cloud-soft shea & cocoa butter that melts into thirsty skin.',
    ingredients: [
      { name: 'Shea butter', amount: '½ cup', storePriceUsd: 3.20 },
      { name: 'Cocoa butter', amount: '¼ cup', storePriceUsd: 2.10 },
      { name: 'Sweet almond oil', amount: '¼ cup', storePriceUsd: 1.50 },
      { name: 'Jojoba oil', amount: '2 tbsp', storePriceUsd: 1.30 },
      { name: 'Vitamin E oil', amount: '1 tsp', storePriceUsd: 0.50 },
      { name: 'Vanilla essential oil', amount: '10 drops', storePriceUsd: 1.40 },
    ],
    steps: [
      'In a heatproof bowl over simmering water, melt shea and cocoa butter.',
      'Remove from heat. Stir in almond oil, jojoba oil, and vitamin E.',
      'Refrigerate 25 – 35 minutes until edges are firm but center is soft.',
      'Whip with a hand mixer on medium for 4 – 5 minutes until cloud-like.',
      'Add vanilla oil, whip 30 more seconds, spoon into a jar, and store cool.',
    ],
    warnings: [
      'Patch-test if you have nut allergies — almond oil is a tree nut.',
      'Will re-melt above 76°F (24°C). Keep away from heat.',
      'Wash hands after applying — surfaces get slippery.',
    ],
    substitutions: [
      { swap: 'Mango butter', for: 'Cocoa butter' },
      { swap: 'Fractionated coconut oil', for: 'Sweet almond oil' },
    ],
  },

  candle: {
    productId: 'candle',
    title: 'Slow-Burn Soy Candle',
    blurb: 'Hand-poured soy with a cotton wick — slow, even, all-evening burn.',
    ingredients: [
      { name: 'Soy wax flakes', amount: '1 lb (~2 cups)', storePriceUsd: 3.40 },
      { name: 'Cotton candle wick', amount: '1 (pre-tabbed)', storePriceUsd: 0.40 },
      { name: 'Fragrance oil (cozy blend)', amount: '1 oz', storePriceUsd: 2.80 },
      { name: 'Glass jar (8 oz)', amount: '1', haveIt: true, storePriceUsd: 2.00 },
      { name: 'Wick centering bar', amount: '1', storePriceUsd: 0.30 },
    ],
    steps: [
      'Stick the wick tab to the center of the jar with a small dab of wax.',
      'Melt soy wax in a double boiler to 180°F (82°C). Stir gently.',
      'Remove from heat, let cool to 135°F (57°C), then add fragrance oil.',
      'Pour slowly into the jar, leaving a half-inch at the top.',
      'Set wick straight with a centering bar. Cool 24 hours before trimming wick to ¼".',
    ],
    warnings: [
      'Hot wax causes serious burns — never leave heating unattended.',
      'Always burn on a stable, heat-safe surface, away from drafts.',
      'Trim wick to ¼" before each light to prevent soot.',
    ],
    substitutions: [
      { swap: 'Coconut-soy blend wax', for: 'Soy wax flakes' },
      { swap: 'Essential oil blend (1 oz)', for: 'Fragrance oil' },
    ],
  },

  'linen-spray': {
    productId: 'linen-spray',
    title: 'Lavender & Chamomile Linen Mist',
    blurb: 'Sleep-friendly mist for sheets, pajamas, and the laundry pile.',
    ingredients: [
      { name: 'Distilled water', amount: '¾ cup', haveIt: true, storePriceUsd: 0.15 },
      { name: 'Witch hazel', amount: '3 tbsp', storePriceUsd: 1.10 },
      { name: 'Lavender essential oil', amount: '25 drops', storePriceUsd: 1.60 },
      { name: 'Roman chamomile oil', amount: '8 drops', storePriceUsd: 1.40 },
      { name: 'Vegetable glycerin', amount: '½ tsp', storePriceUsd: 0.30 },
    ],
    steps: [
      'Pour witch hazel into a 4 oz fine-mist glass bottle.',
      'Add lavender and chamomile oils. Swirl 10 seconds.',
      'Add glycerin (helps the scent linger longer on fabric).',
      'Top with distilled water, leaving a half-inch headspace.',
      'Cap, shake, and rest 30 minutes. Mist sheets 12" away before bed.',
    ],
    warnings: [
      'Spot-test on a hidden corner — oils may leave faint marks on silk.',
      'Avoid spraying directly on memory foam or pillow covers.',
      'Store in a cool, dark place; replace after 6 months.',
    ],
    substitutions: [
      { swap: 'Vodka', for: 'Witch hazel' },
      { swap: 'Bergamot essential oil', for: 'Roman chamomile oil' },
    ],
  },
};

export function findRecipe(productId: string | undefined): Recipe {
  return RECIPES[productId ?? ''] ?? RECIPES['bathroom-cleaner'];
}
