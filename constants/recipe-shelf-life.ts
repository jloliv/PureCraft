// Storage + shelf life answers users always ask: how long does this last,
// does it need refrigeration, does water ruin it, can I keep it on a shelf.
//
// Two tiers — same shape as recipe-benefits:
//   PER_PRODUCT: hand-written for the 10 hero recipes
//   PER_CATEGORY: defaults for the v3 catalog so every recipe has an answer

import type { RecipeCategoryKey } from './recipe-categories';

export type ShelfBadge =
  | 'Pantry Stable'
  | 'Refrigerate'
  | 'Use Quickly'
  | 'Shake Before Use'
  | 'Sensitive to Heat'
  | 'Keep Dry';

export type ShelfLife = {
  duration: string; // "Up to 3 months", "5–7 days refrigerated"
  storage: string; // "Airtight glass jar"
  bestKept?: string; // "Cool, dry place"
  notes?: string[];
  badges: ShelfBadge[];
};

const PER_PRODUCT: Record<string, ShelfLife> = {
  'bathroom-cleaner': {
    duration: '4–6 weeks',
    storage: 'Spray bottle (glass or PET)',
    bestKept: 'Under-sink cabinet, away from sun',
    notes: ['Shake before each use — castile soap settles.'],
    badges: ['Pantry Stable', 'Shake Before Use'],
  },
  'glass-cleaner': {
    duration: '4–6 weeks',
    storage: 'Spray bottle',
    bestKept: 'Cool, dry place',
    notes: [
      'Shake before each use — cornstarch settles fast.',
      'Alcohol is flammable; keep away from heat sources.',
    ],
    badges: ['Pantry Stable', 'Shake Before Use', 'Sensitive to Heat'],
  },
  'kitchen-spray': {
    duration: '6–8 weeks',
    storage: 'Glass spray bottle',
    bestKept: 'Cabinet, out of direct sun',
    notes: ['Lemon-vinegar infusion lasts longer in opaque or amber glass.'],
    badges: ['Pantry Stable', 'Sensitive to Heat'],
  },
  'floor-cleaner': {
    duration: 'Mix per use — don’t store',
    storage: 'Bucket while in use',
    bestKept: 'Discard leftover after the floor is mopped',
    notes: ['Hot water + soap loses potency quickly — fresh batches clean better.'],
    badges: ['Use Quickly'],
  },
  'laundry-booster': {
    duration: 'Up to 6 months',
    storage: 'Sealed glass jar',
    bestKept: 'Dry pantry shelf',
    notes: ['Moisture clumps citric acid — keep the jar tightly closed.'],
    badges: ['Pantry Stable', 'Keep Dry'],
  },
  'room-spray': {
    duration: '2–3 months',
    storage: 'Amber glass bottle',
    bestKept: 'Out of direct sunlight',
    notes: [
      'UV degrades essential oils — amber or cobalt glass extends shelf life.',
      'Shake before each spritz to redistribute oils.',
    ],
    badges: ['Pantry Stable', 'Shake Before Use', 'Sensitive to Heat'],
  },
  'sugar-scrub': {
    duration: 'Up to 3 months',
    storage: 'Airtight glass jar',
    bestKept: 'Cool, dry shelf or shower caddy',
    notes: [
      'Keep water out of the jar — it’s what shortens shelf life.',
      'Scoop with a clean dry hand or small spoon.',
    ],
    badges: ['Pantry Stable', 'Keep Dry'],
  },
  'citrus-glow-scrub': {
    duration: '2–3 weeks',
    storage: 'Clean glass jar with tight lid',
    bestKept: 'Cool, dry place — avoid getting water inside the jar',
    notes: [
      'Fresh zest is what limits the shelf life — small batches keep it bright.',
      'Scoop with a dry hand or small spoon.',
    ],
    badges: ['Use Quickly', 'Keep Dry'],
  },
  'body-butter': {
    duration: '3–4 months',
    storage: 'Wide-mouth glass jar',
    bestKept: 'Below 76 °F / 24 °C — re-melts in heat',
    notes: ['Re-whip if it separates after a hot day.'],
    badges: ['Pantry Stable', 'Sensitive to Heat'],
  },
  candle: {
    duration: '12+ months',
    storage: 'Lid on between burns',
    bestKept: 'Out of direct sunlight',
    notes: [
      'Trim wick to ¼″ before each light to prevent soot.',
      'First burn: melt to the edges (~2 hours) so you don’t tunnel the wax.',
    ],
    badges: ['Pantry Stable', 'Sensitive to Heat'],
  },
  'linen-spray': {
    duration: '4–6 weeks',
    storage: 'Spray bottle',
    bestKept: 'Bedside drawer or closet',
    notes: ['Shake before each spritz — oils don’t stay suspended forever.'],
    badges: ['Pantry Stable', 'Shake Before Use'],
  },

  // V3 launch-catalog hero entries — 20 demo-worthy recipes upgraded.
  '3': {
    duration: '2–3 months',
    storage: 'Sealed glass jar',
    bestKept: 'Dry pantry shelf',
    notes: ['Keep moisture out — humidity makes the bombs fizz prematurely.'],
    badges: ['Pantry Stable', 'Keep Dry'],
  },
  '9': {
    duration: '6 months (vinegar is shelf-stable)',
    storage: 'Spray bottle',
    bestKept: 'Bathroom cabinet',
    notes: ['Ventilate while spraying — vinegar smell dissipates within minutes.'],
    badges: ['Pantry Stable'],
  },
  '10': {
    duration: 'Mix per use — don’t store',
    storage: 'Pour directly into the drain',
    bestKept: 'Discard any leftover',
    notes: ['Always finish with boiling water to flush.'],
    badges: ['Use Quickly'],
  },
  '12': {
    duration: 'Mix per use',
    storage: 'Apply directly to oven walls',
    bestKept: 'Wipe out fully before next bake',
    notes: ['Wear gloves — baking soda paste can dry out skin.'],
    badges: ['Use Quickly'],
  },
  '17': {
    duration: '6 months',
    storage: 'Sealed shaker jar',
    bestKept: 'Linen closet',
    notes: ['Vacuum thoroughly to remove all powder.'],
    badges: ['Pantry Stable', 'Keep Dry'],
  },
  '21': {
    duration: 'Up to 6 months',
    storage: 'Sealed glass jar',
    bestKept: 'Dry pantry shelf',
    notes: ['Moisture clumps the powder — keep the jar tightly closed.'],
    badges: ['Pantry Stable', 'Keep Dry'],
  },
  '25': {
    duration: '4–6 weeks (peroxide degrades)',
    storage: 'Opaque squeeze bottle',
    bestKept: 'Laundry shelf, away from sun',
    notes: ['Hydrogen peroxide breaks down in light — opaque bottle is essential.'],
    badges: ['Use Quickly', 'Sensitive to Heat'],
  },
  '27': {
    duration: '5–7 days, refrigerated',
    storage: 'Airtight jar in the fridge',
    bestKept: 'Refrigerator shelf',
    notes: [
      'Used coffee grounds spoil quickly without refrigeration.',
      'Scoop with a clean dry hand or small spoon.',
    ],
    badges: ['Refrigerate', 'Use Quickly'],
  },
  '28': {
    duration: '6–8 months',
    storage: 'Small lip-balm tins',
    bestKept: 'Pocket, purse, bedside',
    notes: ['Below 76 °F / 24 °C — re-melts in heat.'],
    badges: ['Pantry Stable', 'Sensitive to Heat'],
  },
  '32': {
    duration: '2 months',
    storage: 'Glass mister bottle',
    bestKept: 'Refrigerate after 2 weeks for extra shelf life',
    notes: ['Refrigerated, the toner feels extra cooling on hot days.'],
    badges: ['Pantry Stable', 'Sensitive to Heat'],
  },
  '41': {
    duration: '4 months',
    storage: 'Dropper bottle (amber glass best)',
    bestKept: 'Bathroom cabinet, out of sun',
    notes: ['Castor oil is thick — warm the bottle in your hands before applying.'],
    badges: ['Pantry Stable'],
  },
  '45': {
    duration: '6 months',
    storage: 'Shaker bottle or jar',
    bestKept: 'Vanity drawer',
    notes: ['Use a makeup brush to apply for less powder waste.'],
    badges: ['Pantry Stable', 'Keep Dry'],
  },
  '51': {
    duration: '1 week (refrigerated)',
    storage: 'Sealed container with cloth wipes',
    bestKept: 'Diaper-station shelf or fridge',
    notes: ['Make small batches — water-based formulas spoil quickly.'],
    badges: ['Refrigerate', 'Use Quickly'],
  },
  '60': {
    duration: '4 months',
    storage: 'Wide-mouth glass jar or tin',
    bestKept: 'Diaper-changing station',
    notes: ['Wear a mask when handling zinc oxide powder — don’t inhale.'],
    badges: ['Pantry Stable'],
  },
  '67': {
    duration: '4 months',
    storage: 'Pump or squeeze bottle',
    bestKept: 'Bathroom shelf',
    notes: ['Shake gently before each use.'],
    badges: ['Pantry Stable', 'Shake Before Use'],
  },
  '73': {
    duration: 'Mix per use',
    storage: 'Glass jar with lid (sealed dry spices)',
    bestKept: 'Dry pantry until use',
    notes: ['Once simmered, discard the spent fruit + spices.'],
    badges: ['Use Quickly', 'Keep Dry'],
  },
  '76': {
    duration: '2 months active',
    storage: 'Narrow-neck glass jar',
    bestKept: 'Out of direct sunlight',
    notes: [
      'Flip the reeds weekly to refresh the scent throw.',
      'Rattan reeds last several refills — replace when they stop wicking.',
    ],
    badges: ['Pantry Stable', 'Sensitive to Heat'],
  },
  '80': {
    duration: '6 months',
    storage: 'Small tin with lid',
    bestKept: 'Mudroom or by the leash hook',
    notes: ['Reapply after every wet walk.'],
    badges: ['Pantry Stable', 'Sensitive to Heat'],
  },
  '86': {
    duration: '3 months',
    storage: 'Glass spray bottle',
    bestKept: 'Out of direct sunlight',
    notes: [
      'UV degrades essential oils — opaque or amber glass extends shelf life.',
      'Shake before each application.',
    ],
    badges: ['Pantry Stable', 'Shake Before Use', 'Sensitive to Heat'],
  },
  '100': {
    duration: '1 month',
    storage: 'Sealed glass jar',
    bestKept: 'Under-sink cabinet',
    notes: ['Stir if it dries out — add a teaspoon of water to revive.'],
    badges: ['Pantry Stable', 'Keep Dry'],
  },
};

const PER_CATEGORY: Record<RecipeCategoryKey, ShelfLife> = {
  cleaning: {
    duration: '4–6 weeks',
    storage: 'Spray bottle or sealed jar',
    bestKept: 'Under sink, away from heat',
    notes: ['Shake before each use if it has soap or oils.'],
    badges: ['Pantry Stable', 'Shake Before Use'],
  },
  laundry: {
    duration: 'Up to 6 months',
    storage: 'Sealed jar or container',
    bestKept: 'Dry pantry shelf',
    notes: ['Keep dry — moisture clumps the powder.'],
    badges: ['Pantry Stable', 'Keep Dry'],
  },
  'beauty-skincare': {
    duration: '2–3 months',
    storage: 'Airtight glass jar',
    bestKept: 'Cool, dry shelf',
    notes: ['Use a clean, dry scoop to extend shelf life.'],
    badges: ['Pantry Stable', 'Keep Dry'],
  },
  'hair-care': {
    duration: '2–3 months',
    storage: 'Glass bottle or jar',
    bestKept: 'Out of direct sunlight',
    notes: ['Patch-test before applying to scalp if it’s a new oil for you.'],
    badges: ['Pantry Stable', 'Sensitive to Heat'],
  },
  'baby-family-safe': {
    duration: '2–4 weeks',
    storage: 'Sealed bottle',
    bestKept: 'Make smaller, fresher batches for sensitive skin',
    badges: ['Use Quickly'],
  },
  'home-air-freshening': {
    duration: '2–3 months',
    storage: 'Amber glass bottle',
    bestKept: 'Out of sunlight',
    notes: ['UV degrades essential oils.'],
    badges: ['Pantry Stable', 'Shake Before Use', 'Sensitive to Heat'],
  },
  'pet-safe': {
    duration: '4–6 weeks',
    storage: 'Spray bottle or sealed jar',
    bestKept: 'Out of pet reach, cool place',
    badges: ['Pantry Stable', 'Shake Before Use'],
  },
  'garden-outdoor': {
    duration: 'Mix per use',
    storage: 'Garden sprayer while in use',
    bestKept: 'Discard leftover after application',
    badges: ['Use Quickly'],
  },
  'seasonal-holiday': {
    duration: '2–3 months',
    storage: 'Sealed jar or bottle',
    bestKept: 'Out of direct sunlight',
    badges: ['Pantry Stable', 'Sensitive to Heat'],
  },
  'emergency-budget-hacks': {
    duration: 'Mix per use',
    storage: 'Use immediately',
    bestKept: 'Don’t store — make fresh each time',
    badges: ['Use Quickly'],
  },
};

export function shelfLifeFor(
  productId: string,
  categoryKey?: RecipeCategoryKey | string,
): ShelfLife {
  const override = PER_PRODUCT[productId];
  if (override) return override;
  const k = (categoryKey as RecipeCategoryKey) ?? 'cleaning';
  return PER_CATEGORY[k] ?? PER_CATEGORY.cleaning;
}
