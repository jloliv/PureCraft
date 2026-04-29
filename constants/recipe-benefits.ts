// "Why this recipe is worth making" — the trust + premium-feel layer that
// turns a DIY list into a lifestyle assistant. Two tiers:
//
// 1. PER_PRODUCT: hand-written for the 10 hero recipes (highest-traffic).
// 2. PER_CATEGORY: defaults for the rest of the catalog so every recipe has
//    something thoughtful to show, never an empty card.
//
// At render time we also auto-inject:
//   • a savings bullet when savingsUsd ≥ $5 ("Saves ~$X vs store brands")
//   • a family-safe bullet for safeForKids recipes
//   • an eco bullet for cleaning / laundry / home-air categories
// Phrased to be honest, not overclaiming. No medical promises.

import type { RecipeCategoryKey } from './recipe-categories';

export type RecipeBenefits = {
  benefits: string[];
  bestFor?: string[];
  useFrequency?: string;
  whyItWorks?: string;
};

// =============================================================================
// Per-product overrides — the 10 hand-curated recipes
// =============================================================================

const PER_PRODUCT: Record<string, RecipeBenefits> = {
  'bathroom-cleaner': {
    benefits: [
      'Cuts soap scum without harsh fumes',
      'Freshens surfaces with tea tree + lavender',
      'Lower chemical exposure for daily use',
      'Refillable bottle — less plastic waste',
    ],
    bestFor: ['Daily wipe-downs', 'Family bathrooms', 'Sensitive noses'],
    useFrequency: 'Use as needed',
    whyItWorks:
      'Castile soap and baking soda lift soap scum while vinegar dissolves mineral build-up — one bottle handles three jobs.',
  },

  'glass-cleaner': {
    benefits: [
      'Streak-free glass and mirrors',
      'No chemical haze in the air',
      'Cornstarch is the secret to that streak-free finish',
      'Pennies per spritz vs store brands',
    ],
    bestFor: ['Mirrors', 'Windows', 'Stovetop hoods'],
    useFrequency: 'Weekly or as needed',
    whyItWorks:
      'A pinch of cornstarch breaks surface tension so the spray flashes clean — no streak left behind.',
  },

  'kitchen-spray': {
    benefits: [
      'Cuts everyday kitchen grease',
      'Citrus oils freshen without synthetic perfume',
      'Food-safe enough for countertops',
      'Refill from pantry staples',
    ],
    bestFor: ['Counter wipe-downs', 'Stovetops', 'Sticky drawer fronts'],
    useFrequency: 'Daily',
    whyItWorks:
      'Lemon peels infuse the vinegar with d-limonene — a natural degreaser — while castile soap suspends the lift-off.',
  },

  'floor-cleaner': {
    benefits: [
      'Pet-paw friendly when fully dry',
      'Soft natural finish — no sticky residue',
      'Lemon-fresh, no artificial fragrance',
      'A fraction of name-brand floor wash cost',
    ],
    bestFor: ['Tile', 'Laminate', 'Sealed hardwood'],
    useFrequency: 'Weekly',
    whyItWorks:
      'Castile soap lifts grime, baking soda neutralizes odor, and vinegar evaporates clean — no sticky film.',
  },

  'laundry-booster': {
    benefits: [
      'Brightens whites without bleach',
      'Softens fabric — no synthetic perfume',
      'Sensitive-skin friendly',
      'A few cents per load',
    ],
    bestFor: ['Whites', 'Towels', 'Sensitive skin'],
    useFrequency: '2 tbsp per load',
    whyItWorks:
      'Washing soda boosts your detergent’s lift; citric acid softens hard-water minerals so colors stay bright.',
  },

  'room-spray': {
    benefits: [
      'Resets a room in seconds',
      'Custom-tunable scent — no synthetic notes',
      'Calming lavender + cedarwood blend',
      'Refillable glass bottle, no aerosols',
    ],
    bestFor: ['Living room reset', 'Pre-guest spritz', 'Wind-down routine'],
    useFrequency: 'As often as you like',
    whyItWorks:
      'Witch hazel disperses essential oils evenly through the mist so the scent reads clean — never alcohol-sharp.',
  },

  'sugar-scrub': {
    benefits: [
      'Exfoliates dry, flaky skin',
      'Leaves skin softer and smoother',
      'Helps prep skin before shaving',
      'Spa feel at home',
      'Saves ~$10 vs salon-tier scrubs',
    ],
    bestFor: ['Dry elbows + knees', 'Self-care night', 'Gift jars'],
    useFrequency: 'Use 1–2× weekly',
    whyItWorks:
      'Sugar granules physically lift dead skin while coconut oil seals in moisture during the rinse.',
  },

  'citrus-glow-scrub': {
    benefits: [
      'Brightens dull skin',
      'Exfoliates dead skin cells',
      'Leaves skin soft and smooth',
      'Energizing citrus scent',
    ],
    bestFor: ['Morning shower pick-me-up', 'Dull winter skin', 'Pre-vacation prep'],
    useFrequency: 'Use 2–3× weekly',
    whyItWorks:
      'Sugar polishes away dead skin while coconut oil locks in moisture; lemon and orange zest add a bright, awakening citrus lift.',
  },

  'body-butter': {
    benefits: [
      'Deep, all-day moisture',
      'Whipped texture melts into thirsty skin',
      'No water in the formula = nothing to evaporate',
      'A fraction of salon-tier butter cost',
    ],
    bestFor: ['Post-shower routine', 'Dry winter skin', 'Hands and elbows'],
    useFrequency: 'Daily after shower',
    whyItWorks:
      'Shea + cocoa butter form a breathable seal; jojoba oil mimics your skin’s natural sebum so it absorbs without greasiness.',
  },

  candle: {
    benefits: [
      'Slow, even, all-evening burn',
      'Soy wax — no paraffin soot',
      'Cotton wick = clean burn',
      'Significantly cheaper than boutique candles',
    ],
    bestFor: ['Evening wind-down', 'Dinner ambience', 'Hostess gifts'],
    useFrequency: 'As often as you light it',
    whyItWorks:
      'Soy wax burns at a lower temperature than paraffin, releasing scent steadily over hours instead of all at once.',
  },

  'linen-spray': {
    benefits: [
      'Sleep-friendly lavender + chamomile',
      'Lightly scents sheets and pajamas',
      'Glycerin makes the scent linger longer on fabric',
      'Calming bedtime routine',
    ],
    bestFor: ['Bedding before sleep', 'Pajamas', 'Closet refresh'],
    useFrequency: 'Mist nightly or as needed',
    whyItWorks:
      'Glycerin holds the essential oils on fabric for hours — chamomile + lavender are studied for their calming aromatherapy effect.',
  },

  // =========================================================================
  // V3 launch-catalog overrides — the next 20 demo-worthy recipes upgraded
  // from category defaults to hand-tuned hero copy.
  // =========================================================================

  '3': {
    benefits: [
      'Fizzy, hands-off bowl cleaning',
      'Skips chlorine and bleach',
      'Naturally deodorizing peppermint',
      'Drop-in convenience',
      'A fraction of bowl-cleaner-tab cost',
    ],
    bestFor: ['Quick freshening', 'Family bathrooms', 'Skipping bleach'],
    useFrequency: 'Drop one nightly',
    whyItWorks:
      'Citric acid + baking soda fizz on contact — the reaction lifts mineral build-up while peppermint freshens the bowl.',
  },
  '9': {
    benefits: [
      'Penetrates grout and caulk',
      'Skips bleach and harsh fumes',
      'One ingredient, zero fillers',
      'Pennies per spritz',
      'Refillable glass bottle',
    ],
    bestFor: ['Shower grout', 'Window seals', 'Tile lines'],
    useFrequency: 'Spray weekly',
    whyItWorks:
      'Acetic acid dissolves the surface biofilm mold uses to anchor — and lifts staining without bleach.',
  },
  '10': {
    benefits: [
      'Clears slow drains naturally',
      'Deodorizes the trap',
      'Skips chemical drain cleaners',
      'Pantry-priced fix',
      'Family-safe',
    ],
    bestFor: ['Slow bathroom sinks', 'Kitchen drain odor', 'Monthly maintenance'],
    useFrequency: 'Once a month',
    whyItWorks:
      'The fizzing reaction loosens hair + soap residue while boiling water flushes the lift-off down the trap.',
  },
  '12': {
    benefits: [
      'Loosens baked-on grease overnight',
      'Food-safe — no chemical residue',
      'Skip the self-clean cycle and the fumes',
      'Just two pantry items',
      'A fraction of oven-spray cost',
    ],
    bestFor: ['Holiday roast aftermath', 'Spill cleanup', 'Yearly deep clean'],
    useFrequency: 'Quarterly or as needed',
    whyItWorks:
      'Baking soda’s mild alkalinity dissolves baked-on fats slowly overnight, lifting them off without scrubbing.',
  },
  '17': {
    benefits: [
      'Pulls odor out of carpet fibers',
      'Lavender-fresh, no synthetic perfume',
      'Vacuum-friendly — no residue',
      'Pet-and-pantry-safe',
      'Pennies per use',
    ],
    bestFor: ['Pet zones', 'Living room rugs', 'Mattress freshening'],
    useFrequency: 'Weekly or before guests',
    whyItWorks:
      'Baking soda is a porous odor adsorbent — it grabs odor molecules from carpet fibers, and a quick vacuum lifts them away.',
  },
  '21': {
    benefits: [
      'Cleans like name-brand powders',
      'Skip synthetic fragrance',
      'Cents per load',
      'No plastic jugs to recycle',
      'Customize for sensitive skin',
    ],
    bestFor: ['Whites + everyday loads', 'Sensitive skin', 'Bulk-prep families'],
    useFrequency: '1–2 tbsp per load',
    whyItWorks:
      'Washing soda boosts detergency, baking soda neutralizes odor, and grated soap surfactants release oils — same trio as store-bought powder, without the perfumes.',
  },
  '25': {
    benefits: [
      'Pre-treats grease, food, and red wine',
      'Activates on contact',
      'Bleach-free brightening',
      'Travel-jar friendly',
      'A fraction of stain-pen cost',
    ],
    bestFor: ['Kid clothes', 'Coffee + wine spills', 'Sweat marks'],
    useFrequency: 'Apply, wait 5 min, then wash',
    whyItWorks:
      'Hydrogen peroxide oxidizes the stain pigment while baking soda lifts oil — together they handle both protein and fat stains.',
  },
  '27': {
    benefits: [
      'Stimulates skin with caffeine',
      'Smooths cellulite-prone areas visually',
      'Antioxidant-rich grounds',
      'Cafe-shower aroma',
      'Spa-tier feel for ~$2 a jar',
    ],
    bestFor: ['Pre-shower exfoliation', 'Stretch-prone areas', 'Wake-up routine'],
    useFrequency: 'Use 1–2× weekly',
    whyItWorks:
      'Coffee grounds are a gentle physical exfoliant; coconut oil seals in moisture; caffeine briefly tightens the skin’s surface for a smoother look.',
  },
  '28': {
    benefits: [
      'Three-ingredient pure formula',
      'Skip drying petrolatum',
      'Beeswax-sealed long wear',
      'Refillable tin — no microplastic',
      'One batch makes 6+ tins',
    ],
    bestFor: ['Winter chap', 'Pre-lipstick base', 'Travel kits'],
    useFrequency: 'Daily',
    whyItWorks:
      'Beeswax forms a breathable barrier, coconut oil softens, shea butter holds it in place — three-layer moisture lock without filler.',
  },
  '32': {
    benefits: [
      'Soothes redness',
      'Balances skin pH after cleansing',
      'Two-ingredient simplicity',
      'Glass bottle, no plastic',
      'Salon-tier toner for pennies',
    ],
    bestFor: ['Sensitive skin', 'Post-cleanse', 'Travel kit'],
    useFrequency: 'Twice daily after cleansing',
    whyItWorks:
      'Rosewater calms inflammation while witch hazel acts as a mild astringent — together they tone without stripping.',
  },
  '41': {
    benefits: [
      'Rich scalp-massage routine',
      'Castor oil seals moisture',
      'Supports a healthy scalp environment',
      'Skip parabens and silicones',
      'Months of treatments per bottle',
    ],
    bestFor: ['Weekly scalp treatments', 'Edges + ends', 'Pre-wash overnight'],
    useFrequency: 'Use 1–2× weekly',
    whyItWorks:
      'Castor oil’s high viscosity coats strands; jojoba mimics scalp sebum; the massage itself is what circulates blood flow at the follicle.',
  },
  '45': {
    benefits: [
      'Refreshes second-day hair',
      'Absorbs scalp oil instantly',
      'Cocoa shade for darker hair',
      'Aerosol-free — no propellants',
      'A fraction of salon-can cost',
    ],
    bestFor: ['Bedhead', 'Workout hair', 'Travel'],
    useFrequency: 'As needed between washes',
    whyItWorks:
      'Arrowroot powder is hyper-absorbent — it pulls oil from the scalp on contact while cocoa powder darkens to blend with your tone.',
  },
  '51': {
    benefits: [
      'Cleans without alcohol or fragrance',
      'Coconut-oil softening',
      'Reusable cloth wipes = zero waste',
      'Sensitive-tushie tested',
      'A fraction of name-brand wipe cost',
    ],
    bestFor: ['Newborns', 'Diaper changes', 'Sensitive skin'],
    useFrequency: 'Replace solution weekly',
    whyItWorks:
      'Mild soap lifts; coconut oil moisturizes; the absence of alcohol and synthetic fragrance keeps tiny skin happy.',
  },
  '60': {
    benefits: [
      'Soothes red, irritated skin',
      'Forms a protective moisture barrier',
      'Zinc oxide reduces wetness',
      'Pediatrician-style formulation',
      'Saves vs name-brand tubes',
    ],
    bestFor: ['Diaper area', 'Eczema patches', 'Chafing'],
    useFrequency: 'At every diaper change',
    whyItWorks:
      'Zinc oxide creates a physical barrier from moisture while shea + coconut deeply moisturize underneath.',
  },
  '67': {
    benefits: [
      'Tear-free castile-soap base',
      'Light vanilla scent',
      'Skin-loving glycerin',
      'A fraction of Mr. Bubble cost',
      'Gentler than synthetic bubble baths',
    ],
    bestFor: ['Bedtime baths', 'Tear-prone toddlers', 'Family bath time'],
    useFrequency: 'As needed',
    whyItWorks:
      'Castile soap creates gentle suds while glycerin attracts moisture to skin during the soak.',
  },
  '73': {
    benefits: [
      'Fills the home with cozy scent',
      'Zero artificial fragrance',
      'Whole-spice naturally scented',
      'Reusable on the stove for hours',
      'Budget-friendly air freshener',
    ],
    bestFor: ['Holiday hosting', 'Fall evenings', 'Homey ambience'],
    useFrequency: 'Simmer 2–4 hours',
    whyItWorks:
      'Heat releases essential oils naturally locked in cinnamon bark and clove buds — a whole-house diffuser without electronics.',
  },
  '76': {
    benefits: [
      'Continuous, electricity-free scent',
      'Custom essential-oil blend',
      'Reed-driven distribution',
      'Reusable glass jar',
      'A fraction of $35 boutique diffusers',
    ],
    bestFor: ['Entryway', 'Bathroom', 'Office desk'],
    useFrequency: 'Flip reeds weekly · refill in 2 months',
    whyItWorks:
      'Rattan reeds wick the oil-vodka mixture upward via capillary action — the alcohol evaporates and disperses scent into the room.',
  },
  '80': {
    benefits: [
      'Protects paws on hot pavement and salty winter sidewalks',
      'Heals cracked pads',
      'Calendula-style soothing',
      'Pet-tongue-safe ingredients',
      'Months of nightly care per tin',
    ],
    bestFor: ['Walking dogs', 'Hot-pavement summers', 'Salt-streets winters'],
    useFrequency: 'Nightly during extreme weather',
    whyItWorks:
      'Beeswax forms a flexible barrier while shea + coconut moisturize underneath — same components in $20 pet-store balms.',
  },
  '86': {
    benefits: [
      'Skips DEET',
      'Plant-based citronella + lemongrass',
      'Skin-friendly carrier',
      'Travel-bottle ready',
      'Saves vs Off!-spray costs',
    ],
    bestFor: ['Backyard evenings', 'Hiking', 'Beach trips'],
    useFrequency: 'Reapply every 1–2 hours',
    whyItWorks:
      'Citronella + lemongrass essential oils mask the CO₂ + lactic-acid signals mosquitoes track — without the neurotoxin profile of DEET.',
  },
  '100': {
    benefits: [
      'Replaces three cleaners (sink, tub, tile)',
      'Two-ingredient simplicity',
      'Castile-soap natural cleaning',
      'Mild abrasive — won’t scratch porcelain',
      'Pantry-priced',
    ],
    bestFor: ['Apartment cleaning', 'Travel', 'Quick reset'],
    useFrequency: 'Weekly',
    whyItWorks:
      'Baking soda’s gentle abrasion + castile’s surfactant pull dirt off without damaging surfaces — a Bar Keepers Friend dupe in a jar.',
  },
};

// =============================================================================
// Per-category defaults — used when a v3 recipe doesn't have a specific entry
// =============================================================================

const PER_CATEGORY: Record<RecipeCategoryKey, RecipeBenefits> = {
  cleaning: {
    benefits: [
      'Cuts grease and surface grime',
      'Freshens with simple pantry ingredients',
      'Lower harsh-chemical exposure',
      'Refillable — less single-use plastic',
    ],
    useFrequency: 'Use as needed',
  },
  laundry: {
    benefits: [
      'Cleans clothes affordably',
      'Lower cost per load than name brands',
      'Reduces packaging waste',
      'Customize scent or skip it entirely',
    ],
    useFrequency: 'Use per load',
  },
  'beauty-skincare': {
    benefits: [
      'Hydrates and softens skin',
      'A clean-ingredient routine at home',
      'Spa-tier feel for a fraction of the cost',
      'Refillable jars — less waste',
    ],
    useFrequency: 'Use 1–2× weekly',
  },
  'hair-care': {
    benefits: [
      'Supports a moisturizing scalp routine',
      'Helps seal in moisture along strands',
      'Customizable to your hair type',
      'Less salon-spend per month',
    ],
    useFrequency: 'Use weekly or as needed',
  },
  'baby-family-safe': {
    benefits: [
      'Gentler ingredients for small humans',
      'Fewer harsh fragrances',
      'Family-conscious, sensitive-skin friendly',
      'Refillable — less plastic in the home',
    ],
    useFrequency: 'Use as needed',
  },
  'home-air-freshening': {
    benefits: [
      'Freshens rooms naturally',
      'Custom scent — no synthetic perfume',
      'Cozy atmosphere on demand',
      'A fraction of boutique-spray cost',
    ],
    useFrequency: 'Use as often as you like',
  },
  'pet-safe': {
    benefits: [
      'Made with pet-safety in mind',
      'Skips ingredients that irritate pets',
      'Gentle enough for daily home use',
      'Fewer harsh fumes around the family',
    ],
    useFrequency: 'Use as needed',
  },
  'garden-outdoor': {
    benefits: [
      'Outdoor-ready, no harsh runoff',
      'Pantry-priced vs garden-aisle sprays',
      'Multi-purpose around the yard',
      'Customize for plant-safe use',
    ],
    useFrequency: 'Use seasonally',
  },
  'seasonal-holiday': {
    benefits: [
      'Captures the season in scent',
      'Unique gift-worthy results',
      'Way cheaper than holiday boutique items',
      'Customize the strength to your taste',
    ],
    useFrequency: 'Use during the season',
  },
  'emergency-budget-hacks': {
    benefits: [
      'Built from pantry staples',
      'Zero shopping trip required',
      'Saves money on a one-off need',
      'Skip running to the store',
    ],
    useFrequency: 'Use when you need it',
  },
};

export function benefitsFor(
  productId: string,
  categoryKey?: RecipeCategoryKey | string,
): RecipeBenefits {
  const override = PER_PRODUCT[productId];
  if (override) return override;
  const k = (categoryKey as RecipeCategoryKey) ?? 'cleaning';
  return PER_CATEGORY[k] ?? PER_CATEGORY.cleaning;
}

// Auto-injected bullets — appended at render time when relevant. We keep
// them separate so the override copy stays clean and we don't double up.
export function autoBullets(opts: {
  savingsLabel?: string | null;
  safeForKids?: boolean;
  categoryKey?: RecipeCategoryKey | string;
}): string[] {
  const out: string[] = [];
  if (opts.savingsLabel) {
    out.push(`Saves ${opts.savingsLabel} vs store brands`);
  }
  if (opts.safeForKids) {
    out.push('Family-safe formula');
  }
  if (
    opts.categoryKey &&
    ['cleaning', 'laundry', 'home-air-freshening'].includes(
      String(opts.categoryKey),
    )
  ) {
    out.push('Refillable — less single-use plastic');
  }
  return out;
}
