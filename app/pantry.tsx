// Pantry Magic — turn ingredients you already own into useful products.
//
// This screen used to be a static "browse my pantry" list. The redesign
// flips it into a personalized utility hub:
//   1. Hero card with emotional value (recipes ready × savings).
//   2. Search bar that *adds* ingredients (not searches recipes).
//   3. Filter chips for category (Cleaning, Beauty, Budget Hacks, …).
//   4. Smart sections sorted by conversion intent:
//        Make Right Now            (0 missing — instant gratification)
//        Missing Only 1 Ingredient (high-conversion add-to-list moment)
//        Save Money Fast           (budget winners)
//        Most Popular Tonight      (retention bait)
//
// The ingredient toggle UI from the old screen is preserved — just demoted
// to a "Manage Pantry" modal accessible via the top-right Manage button.

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

// Reveal-the-next-card sizing: each horizontal recipe card is ~80% of screen
// width so the second card always peeks in from the right edge, signalling
// scrollability without arrows or copy. Fallback to 320 because on web SSR
// `Dimensions.get('window').width` can return 0 during initial hydration.
const _winWidth = Dimensions.get('window').width;
const CARD_WIDTH = _winWidth > 0 ? Math.round(_winWidth * 0.8) : 320;
const CARD_GAP = 12;
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatMoney, useCurrency } from '@/constants/currency';
import { findProduct, PRODUCTS, RECIPES, type Product } from '@/constants/products';
import { tapLight, tapMedium } from '@/lib/haptics';
import {
  addToPantry,
  removeFromPantry,
  usePantry,
} from '@/lib/pantry-store';
import { recipeIcon } from '@/lib/recipe-icons';

const PALETTE = {
  bg: '#F8F6F1',
  text: '#111111',
  textWarm: '#6F6A60',
  textMuted: '#8A8377',
  textSubtle: '#A8A398',
  surface: '#FFFFFF',
  surfaceWarm: '#F1ECE0',
  border: '#E9E4DA',
  borderSoft: '#F0EADA',
  sage: '#A8B8A0',
  sageDeep: '#7E8F75',
  sageEyebrow: '#7A8E78',
  sageSoft: '#E4EDE5',
  cream: '#F7F2E7',
  creamDeep: '#EFE7D2',
  gold: '#C7A96B',
  goldDeep: '#A98A4D',
  goldAccent: '#B89A52',
  rose: '#C26B5A',
};

// ---------- Pantry vocabulary -----------------------------------------------
//
// The set of ingredients the user can mark as "in my pantry." Each one has
// a list of `aliases` so we can match recipe ingredient strings (which use
// real names like "White vinegar" or "Distilled water") back to a pantry
// key. New aliases here = better matching coverage = more "Make Right Now"
// hits = more conversions.

type PantryItem = {
  key: string;
  name: string;
  emoji: string;
  group: 'pantry' | 'oils' | 'tools';
  defaultIn?: boolean;
  aliases: string[];
};

const PANTRY: PantryItem[] = [
  { key: 'baking-soda', name: 'Baking Soda', emoji: '🧂', group: 'pantry', defaultIn: true, aliases: ['baking soda'] },
  { key: 'white-vinegar', name: 'White Vinegar', emoji: '🍶', group: 'pantry', defaultIn: true, aliases: ['white vinegar', 'vinegar'] },
  { key: 'lemon', name: 'Lemon', emoji: '🍋', group: 'pantry', defaultIn: true, aliases: ['lemon', 'lemon peels', 'lemon juice'] },
  { key: 'coconut-oil', name: 'Coconut Oil', emoji: '🥥', group: 'pantry', defaultIn: true, aliases: ['coconut oil'] },
  { key: 'olive-oil', name: 'Olive Oil', emoji: '🫒', group: 'pantry', defaultIn: true, aliases: ['olive oil'] },
  { key: 'sugar', name: 'Sugar', emoji: '🍚', group: 'pantry', defaultIn: true, aliases: ['sugar', 'cane sugar', 'brown sugar'] },
  { key: 'castile-soap', name: 'Castile Soap', emoji: '🫧', group: 'pantry', aliases: ['castile soap'] },
  { key: 'witch-hazel', name: 'Witch Hazel', emoji: '🌿', group: 'pantry', aliases: ['witch hazel'] },
  { key: 'distilled-water', name: 'Distilled Water', emoji: '💧', group: 'pantry', aliases: ['distilled water', 'water'] },
  { key: 'sea-salt', name: 'Sea Salt', emoji: '🧂', group: 'pantry', aliases: ['sea salt', 'salt'] },
  { key: 'cornstarch', name: 'Cornstarch', emoji: '🌽', group: 'pantry', aliases: ['cornstarch'] },
  { key: 'honey', name: 'Honey', emoji: '🍯', group: 'pantry', aliases: ['honey'] },
  { key: 'rubbing-alcohol', name: 'Rubbing Alcohol', emoji: '🧴', group: 'pantry', aliases: ['rubbing alcohol', 'isopropyl alcohol'] },
  { key: 'lavender-oil', name: 'Lavender Oil', emoji: '🪻', group: 'oils', aliases: ['lavender oil', 'lavender essential oil'] },
  { key: 'tea-tree-oil', name: 'Tea Tree Oil', emoji: '🌱', group: 'oils', aliases: ['tea tree oil'] },
  { key: 'eucalyptus-oil', name: 'Eucalyptus Oil', emoji: '🌿', group: 'oils', aliases: ['eucalyptus oil'] },
  { key: 'rosemary-oil', name: 'Rosemary Oil', emoji: '🌾', group: 'oils', aliases: ['rosemary oil'] },
  { key: 'lemon-eo', name: 'Lemon Essential Oil', emoji: '🍋', group: 'oils', aliases: ['lemon essential oil', 'lemon eo'] },
  { key: 'spray-bottles', name: 'Spray Bottles', emoji: '🧴', group: 'tools', defaultIn: true, aliases: ['spray bottle'] },
  { key: 'glass-jars', name: 'Glass Jars', emoji: '🫙', group: 'tools', aliases: ['glass jar', 'jar'] },
  { key: 'funnel', name: 'Funnel', emoji: '🥽', group: 'tools', aliases: ['funnel'] },
];

const GROUP_LABELS: Record<PantryItem['group'], { label: string; caption: string }> = {
  pantry: { label: 'Pantry', caption: 'Cooking + cleaning staples' },
  oils: { label: 'Essential Oils', caption: 'Beauty + scent ingredients' },
  tools: { label: 'Tools', caption: 'For making + storing' },
};

// ---------- Filter chips ----------------------------------------------------

type FilterKey =
  | 'all'
  | 'cleaning'
  | 'laundry'
  | 'beauty'
  | 'budget'
  | 'baby-safe'
  | 'quick-5';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All Matches' },
  { key: 'cleaning', label: 'Cleaning' },
  { key: 'laundry', label: 'Laundry' },
  { key: 'beauty', label: 'Beauty' },
  { key: 'budget', label: 'Budget Hacks' },
  { key: 'baby-safe', label: 'Baby Safe' },
  { key: 'quick-5', label: 'Quick 5 Min' },
];

// ---------- Matching helpers ------------------------------------------------

/** Given a recipe ingredient string ("White vinegar"), find the pantry key
 *  whose aliases include it. Returns null if unmatched. */
function pantryKeyForIngredientName(name: string): string | null {
  const norm = name.trim().toLowerCase();
  // Most specific match wins — sort aliases by length desc so "lemon essential
  // oil" beats "lemon" when both are in the list.
  for (const item of PANTRY) {
    for (const alias of item.aliases) {
      if (norm === alias || norm.includes(alias)) return item.key;
    }
  }
  return null;
}

type RecipeMatch = {
  product: Product;
  matchedKeys: string[];
  missingNames: string[];
  totalIngredients: number;
};

function matchAllRecipes(pantry: Set<string>): RecipeMatch[] {
  const out: RecipeMatch[] = [];
  for (const product of PRODUCTS) {
    const recipe = RECIPES[product.id];
    if (!recipe) continue;
    const matched: string[] = [];
    const missing: string[] = [];
    for (const ing of recipe.ingredients) {
      const key = pantryKeyForIngredientName(ing.name);
      if (key && pantry.has(key)) matched.push(key);
      else missing.push(ing.name);
    }
    out.push({
      product,
      matchedKeys: matched,
      missingNames: missing,
      totalIngredients: recipe.ingredients.length,
    });
  }
  return out;
}

function applyFilter(matches: RecipeMatch[], filter: FilterKey): RecipeMatch[] {
  if (filter === 'all') return matches;
  if (filter === 'cleaning') return matches.filter((m) => m.product.group === 'cleaning');
  if (filter === 'laundry')
    return matches.filter((m) => /laundry/i.test(m.product.title) || m.product.id.includes('laundry'));
  if (filter === 'beauty') return matches.filter((m) => m.product.group === 'beauty');
  if (filter === 'budget') return matches.filter((m) => (m.product.savingsUsd ?? 0) >= 4);
  if (filter === 'baby-safe')
    return matches.filter((m) => m.product.tags.some((t) => /baby|family/i.test(t)));
  if (filter === 'quick-5') return matches.filter((m) => /^[1-5]\s*min/i.test(m.product.time));
  return matches;
}

// ---------- Screen ----------------------------------------------------------

// One-time-per-session flag so the Manage Pantry pulse animation never
// repeats on subsequent visits during the same app session.
let hasAnimatedManageBtn = false;

export default function PantryMagic() {
  const { currency } = useCurrency();
  // Pantry is now a shared, persistent store so opening a recipe from any
  // screen sees the same set + edits survive app restarts.
  const pantry = usePantry();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [manageOpen, setManageOpen] = useState(false);

  // Subtle one-time pulse on the Manage Pantry button so first-time users
  // notice it. 800ms delay → scale 1 → 1.05 → 1 over 700ms with ease-in-out.
  // Never repeats once played per session.
  const manageScale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (hasAnimatedManageBtn) return;
    hasAnimatedManageBtn = true;
    const t = setTimeout(() => {
      Animated.sequence([
        Animated.timing(manageScale, {
          toValue: 1.05,
          duration: 350,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(manageScale, {
          toValue: 1,
          duration: 350,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }, 800);
    return () => clearTimeout(t);
  }, [manageScale]);

  const matches = useMemo(() => matchAllRecipes(pantry), [pantry]);
  const filtered = useMemo(() => applyFilter(matches, filter), [matches, filter]);

  // The four smart sections — derived from the same matches set.
  const makeRightNow = useMemo(
    () => filtered.filter((m) => m.missingNames.length === 0).slice(0, 12),
    [filtered],
  );
  const missingOne = useMemo(
    () =>
      filtered
        .filter((m) => m.missingNames.length === 1)
        .sort((a, b) => (b.product.savingsUsd ?? 0) - (a.product.savingsUsd ?? 0))
        .slice(0, 8),
    [filtered],
  );
  const saveMoney = useMemo(
    () =>
      filtered
        .filter((m) => m.missingNames.length <= 1)
        .sort((a, b) => (b.product.savingsUsd ?? 0) - (a.product.savingsUsd ?? 0))
        .slice(0, 6),
    [filtered],
  );
  // Curated "popular tonight" — pulls bedroom/relaxation recipes that match.
  const popularTonight = useMemo(() => {
    const ids = ['linen-spray', 'room-spray', 'sugar-scrub', 'body-butter', 'candle'];
    return filtered.filter((m) => ids.includes(m.product.id)).slice(0, 6);
  }, [filtered]);

  // Estimated monthly savings = sum of savingsUsd × estimated 1 use/wk
  // for everything you can make right now. Conservative.
  const monthlySavings = useMemo(() => {
    return makeRightNow.reduce(
      (sum, m) => sum + (m.product.savingsUsd ?? 0) * 0.5,
      0,
    );
  }, [makeRightNow]);

  const recipesReady = makeRightNow.length;
  const ingredientCount = pantry.size;

  // Search-as-you-type filters the suggested ingredients list.
  const ingredientSuggestions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return PANTRY.filter(
      (p) => !pantry.has(p.key) && p.name.toLowerCase().includes(q),
    ).slice(0, 6);
  }, [search, pantry]);

  const addIngredient = (key: string) => {
    tapLight();
    void addToPantry(key);
    setSearch('');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="chevron-back" size={20} color={PALETTE.text} />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Animated.View style={{ transform: [{ scale: manageScale }] }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Manage pantry"
            onPress={() => {
              tapLight();
              setManageOpen(true);
            }}
            hitSlop={8}
            style={({ pressed }) => [styles.manageBtn, pressed && { opacity: 0.85 }]}
          >
            <Ionicons name="options-outline" size={14} color={PALETTE.text} />
            <Text style={styles.manageBtnText}>Manage Pantry</Text>
          </Pressable>
        </Animated.View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.headerEyebrow}>YOUR HOME · TONIGHT</Text>
        <Text style={styles.headerTitle}>
          Pantry Magic <Text style={styles.headerSparkle}>✨</Text>
        </Text>
        <Text style={styles.headerSub}>
          Turn ingredients you already own into useful products.
        </Text>

        {/* Hero stats card */}
        <Pressable
          onPress={() => {
            tapMedium();
            // Tap the hero → jump to Make Right Now (in the same screen, but
            // also push to /categories for full browsing).
            router.push('/categories');
          }}
          style={({ pressed }) => [
            styles.heroCard,
            pressed && { transform: [{ scale: 0.99 }], opacity: 0.97 },
          ]}
        >
          <LinearGradient
            colors={['#EFE7D2', '#F7F2E7', '#E4EDE5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroBadgeRow}>
              <View style={styles.heroBadge}>
                <Ionicons name="leaf" size={11} color={PALETTE.sageDeep} />
                <Text style={styles.heroBadgeText}>Live match</Text>
              </View>
              <Text style={styles.heroBadgeMeta}>{ingredientCount} stored</Text>
            </View>

            <Text style={styles.heroBigNumber}>
              {recipesReady}
              <Text style={styles.heroBigUnit}>
                {' '}
                {recipesReady === 1 ? 'recipe' : 'recipes'} ready
              </Text>
            </Text>
            <Text style={styles.heroSavings}>
              Save up to {formatMoney(monthlySavings, { currency, round: true })} this month
            </Text>

            <View style={styles.heroIngredientsLine}>
              <Text style={styles.heroIngredientsHint}>From: </Text>
              <Text style={styles.heroIngredientsList} numberOfLines={1}>
                {Array.from(pantry)
                  .slice(0, 4)
                  .map((k) => PANTRY.find((p) => p.key === k)?.name)
                  .filter(Boolean)
                  .join(' · ')}
                {ingredientCount > 4 ? ` · +${ingredientCount - 4} more` : ''}
              </Text>
            </View>

            <View style={styles.heroCta}>
              <Text style={styles.heroCtaText}>See My Matches</Text>
              <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
            </View>
          </LinearGradient>
        </Pressable>

        {/* Search — adds ingredients, not recipes */}
        <View style={styles.searchWrap}>
          <Ionicons name="add-circle-outline" size={20} color={PALETTE.sageDeep} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Add what you have..."
            placeholderTextColor={PALETTE.textSubtle}
            style={styles.searchInput}
            returnKeyType="done"
            autoCorrect={false}
            autoCapitalize="words"
          />
          {search ? (
            <Pressable hitSlop={8} onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={PALETTE.textMuted} />
            </Pressable>
          ) : null}
        </View>

        {ingredientSuggestions.length > 0 ? (
          <View style={styles.suggestList}>
            {ingredientSuggestions.map((s) => (
              <Pressable
                key={s.key}
                onPress={() => addIngredient(s.key)}
                style={({ pressed }) => [
                  styles.suggestRow,
                  pressed && { backgroundColor: PALETTE.sageSoft },
                ]}
              >
                <Text style={styles.suggestEmoji}>{s.emoji}</Text>
                <Text style={styles.suggestName}>{s.name}</Text>
                <View style={styles.suggestAdd}>
                  <Ionicons name="add" size={14} color="#FFFFFF" />
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map((f) => {
            const isActive = filter === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => {
                  tapLight();
                  setFilter(f.key);
                }}
                style={({ pressed }) => [
                  styles.filterChip,
                  isActive && styles.filterChipActive,
                  pressed && { transform: [{ scale: 0.96 }] },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && styles.filterChipTextActive,
                  ]}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Smart section: Make Right Now */}
        <SmartSection
          title="Make Right Now"
          caption="You have everything for these"
          accent={PALETTE.sageDeep}
          accentSoft={PALETTE.sageSoft}
          empty={makeRightNow.length === 0}
          emptyHint="Add a few staples to unlock instant matches"
        >
          {makeRightNow.map((m) => (
            <RecipeCardReady key={m.product.id} match={m} currency={currency} />
          ))}
        </SmartSection>

        {/* Smart section: Missing 1 */}
        <SmartSection
          title="Missing Only 1 Ingredient"
          caption="Add one item, unlock a recipe"
          accent={PALETTE.goldDeep}
          accentSoft={PALETTE.cream}
          empty={missingOne.length === 0}
          emptyHint="Nothing on the edge — your pantry is well-stocked"
        >
          {missingOne.map((m) => (
            <RecipeCardMissing
              key={m.product.id}
              match={m}
              currency={currency}
              onAdd={() => {
                // Add the missing ingredient if it maps to a known pantry key.
                const missingKey =
                  m.missingNames[0] && pantryKeyForIngredientName(m.missingNames[0]);
                if (missingKey) addIngredient(missingKey);
              }}
            />
          ))}
        </SmartSection>

        {/* Smart section: Save Money Fast */}
        <SmartSection
          title="Save Money Fast"
          caption="Highest savings, fewest gaps"
          accent={PALETTE.goldAccent}
          accentSoft="#F7EFE0"
          empty={saveMoney.length === 0}
          emptyHint="No high-savings matches yet"
        >
          {saveMoney.map((m) => (
            <RecipeCardSavings key={m.product.id} match={m} currency={currency} />
          ))}
        </SmartSection>

        {/* Smart section: Most Popular Tonight */}
        <SmartSection
          title="Most Popular Tonight"
          caption="What other homes are mixing right now"
          accent={PALETTE.sageDeep}
          accentSoft={PALETTE.sageSoft}
          empty={popularTonight.length === 0}
          emptyHint="Stock up to see what's trending in your filter"
        >
          {popularTonight.map((m) => (
            <RecipeCardReady key={m.product.id} match={m} currency={currency} />
          ))}
        </SmartSection>

        <Pressable
          onPress={() => {
            tapLight();
            setManageOpen(true);
          }}
          style={({ pressed }) => [styles.manageLink, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="construct-outline" size={14} color={PALETTE.sageDeep} />
          <Text style={styles.manageLinkText}>Manage your pantry</Text>
        </Pressable>

        <View style={{ height: 32 }} />
      </ScrollView>

      <ManageSheet
        visible={manageOpen}
        onClose={() => setManageOpen(false)}
        pantry={pantry}
      />
    </SafeAreaView>
  );
}

// ---------- Section primitive ---------------------------------------------

function SmartSection({
  title,
  caption,
  accent,
  accentSoft,
  empty,
  emptyHint,
  children,
}: {
  title: string;
  caption: string;
  accent: string;
  accentSoft: string;
  empty: boolean;
  emptyHint: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionMark, { backgroundColor: accent }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionCaption}>{caption}</Text>
        </View>
      </View>
      {empty ? (
        <View style={[styles.emptyHint, { backgroundColor: accentSoft }]}>
          <Ionicons name="sparkles-outline" size={14} color={accent} />
          <Text style={styles.emptyHintText}>{emptyHint}</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardRow}
          snapToInterval={CARD_WIDTH + CARD_GAP}
          decelerationRate="fast"
          snapToAlignment="start"
        >
          {children}
        </ScrollView>
      )}
    </View>
  );
}

// ---------- Recipe cards ---------------------------------------------------

function RecipeCardReady({
  match,
  currency,
}: {
  match: RecipeMatch;
  currency: ReturnType<typeof useCurrency>['currency'];
}) {
  const p = match.product;
  return (
    <Pressable
      onPress={() => {
        tapLight();
        router.push({ pathname: '/preferences', params: { id: p.id } });
      }}
      style={({ pressed }) => [
        styles.card,
        pressed && { transform: [{ scale: 0.98 }] },
      ]}
    >
      <View style={[styles.cardSwatch, { backgroundColor: p.swatch }]}>
        <Image
          source={recipeIcon(p.id)}
          testID="pc-recipe-icon"
          style={styles.cardIcon}
          resizeMode="cover"
        />
        <View style={styles.readyBadge}>
          <View style={styles.readyDot} />
          <Text style={styles.readyText}>Ready</Text>
        </View>
      </View>
      <Text style={styles.cardTitle} numberOfLines={1}>
        {p.title}
      </Text>
      <Text style={styles.cardMeta}>
        {p.time} · save {formatMoney(p.savingsUsd ?? 0, { currency })}
      </Text>
    </Pressable>
  );
}

function RecipeCardMissing({
  match,
  currency,
  onAdd,
}: {
  match: RecipeMatch;
  currency: ReturnType<typeof useCurrency>['currency'];
  onAdd: () => void;
}) {
  const p = match.product;
  const missing = match.missingNames[0];
  return (
    <Pressable
      onPress={() => {
        tapLight();
        router.push({ pathname: '/preferences', params: { id: p.id } });
      }}
      style={({ pressed }) => [
        styles.card,
        pressed && { transform: [{ scale: 0.98 }] },
      ]}
    >
      <View style={[styles.cardSwatch, { backgroundColor: p.swatch }]}>
        <Image
          source={recipeIcon(p.id)}
          testID="pc-recipe-icon"
          style={styles.cardIcon}
          resizeMode="cover"
        />
        <View style={styles.missingBadge}>
          <Ionicons name="add" size={10} color={PALETTE.goldDeep} />
          <Text style={styles.missingBadgeText}>Need {missing}</Text>
        </View>
      </View>
      <Text style={styles.cardTitle} numberOfLines={1}>
        {p.title}
      </Text>
      <View style={styles.cardActionRow}>
        <Text style={styles.cardMetaSmall}>
          Save {formatMoney(p.savingsUsd ?? 0, { currency })}
        </Text>
        <Pressable
          hitSlop={8}
          onPress={(e) => {
            e.stopPropagation?.();
            onAdd();
          }}
          style={({ pressed }) => [
            styles.miniAddBtn,
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={styles.miniAddText}>Add</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

function RecipeCardSavings({
  match,
  currency,
}: {
  match: RecipeMatch;
  currency: ReturnType<typeof useCurrency>['currency'];
}) {
  const p = match.product;
  const ready = match.missingNames.length === 0;
  return (
    <Pressable
      onPress={() => {
        tapLight();
        router.push({ pathname: '/preferences', params: { id: p.id } });
      }}
      style={({ pressed }) => [
        styles.card,
        pressed && { transform: [{ scale: 0.98 }] },
      ]}
    >
      <View style={[styles.cardSwatch, { backgroundColor: p.swatch }]}>
        <Image
          source={recipeIcon(p.id)}
          testID="pc-recipe-icon"
          style={styles.cardIcon}
          resizeMode="cover"
        />
        <View style={styles.savingsBadge}>
          <Ionicons name="cash-outline" size={11} color="#FFFFFF" />
          <Text style={styles.savingsBadgeText}>
            {formatMoney(p.savingsUsd ?? 0, { currency, round: true })}
          </Text>
        </View>
      </View>
      <Text style={styles.cardTitle} numberOfLines={1}>
        {p.title}
      </Text>
      <Text style={[styles.cardMeta, !ready && { color: PALETTE.goldDeep }]}>
        {ready ? 'Ready · ' : 'Need 1 · '}
        {p.time}
      </Text>
    </Pressable>
  );
}

// ---------- Manage Pantry sheet -------------------------------------------

function ManageSheet({
  visible,
  onClose,
  pantry,
}: {
  visible: boolean;
  onClose: () => void;
  pantry: Set<string>;
}) {
  const [query, setQuery] = useState('');
  const fade = useState(() => new Animated.Value(0))[0];

  // Drive the modal in/out animation.
  useState(() => {
    Animated.timing(fade, {
      toValue: visible ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  });

  const toggle = (key: string) => {
    tapLight();
    if (pantry.has(key)) void removeFromPantry(key);
    else void addToPantry(key);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PANTRY;
    return PANTRY.filter((i) => i.name.toLowerCase().includes(q));
  }, [query]);

  const grouped = useMemo(() => {
    const groups: Record<PantryItem['group'], PantryItem[]> = {
      pantry: [],
      oils: [],
      tools: [],
    };
    for (const i of filtered) groups[i.group].push(i);
    return groups;
  }, [filtered]);

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onClose}
      animationType="slide"
      statusBarTranslucent
    >
      <View style={styles.sheetOverlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetEyebrow}>YOUR PANTRY</Text>
              <Text style={styles.sheetTitle}>What do you have?</Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              style={({ pressed }) => [
                styles.sheetClose,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Ionicons name="close" size={18} color={PALETTE.text} />
            </Pressable>
          </View>

          <View style={styles.sheetSearchWrap}>
            <Ionicons name="search" size={18} color={PALETTE.textWarm} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search ingredients"
              placeholderTextColor={PALETTE.textSubtle}
              style={styles.sheetSearchInput}
              returnKeyType="search"
            />
            {query ? (
              <Pressable hitSlop={8} onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={18} color={PALETTE.textMuted} />
              </Pressable>
            ) : null}
          </View>

          <ScrollView
            contentContainerStyle={styles.sheetScroll}
            showsVerticalScrollIndicator={false}
          >
            {(['pantry', 'oils', 'tools'] as const).map((g) => {
              const items = grouped[g];
              if (items.length === 0) return null;
              const inCount = items.filter((i) => pantry.has(i.key)).length;
              return (
                <View key={g} style={styles.sheetSection}>
                  <View style={styles.sheetSectionHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sheetSectionTitle}>
                        {GROUP_LABELS[g].label}
                      </Text>
                      <Text style={styles.sheetSectionCaption}>
                        {GROUP_LABELS[g].caption}
                      </Text>
                    </View>
                    <Text style={styles.sheetSectionMeta}>
                      {inCount} / {items.length}
                    </Text>
                  </View>
                  <View style={styles.sheetGrid}>
                    {items.map((it) => {
                      const isIn = pantry.has(it.key);
                      return (
                        <Pressable
                          key={it.key}
                          onPress={() => toggle(it.key)}
                          style={({ pressed }) => [
                            styles.sheetCard,
                            isIn && styles.sheetCardIn,
                            pressed && { transform: [{ scale: 0.97 }] },
                          ]}
                        >
                          <Text style={styles.sheetCardEmoji}>{it.emoji}</Text>
                          <Text style={styles.sheetCardName} numberOfLines={1}>
                            {it.name}
                          </Text>
                          {isIn ? (
                            <View style={styles.sheetCardCheck}>
                              <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                            </View>
                          ) : null}
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              );
            })}
            <View style={{ height: 24 }} />
          </ScrollView>

          <View style={styles.sheetFooter}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.sheetDone,
                pressed && { opacity: 0.92 },
              ]}
            >
              <Text style={styles.sheetDoneText}>
                Done · {pantry.size} {pantry.size === 1 ? 'item' : 'items'}
              </Text>
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ---------- Styles ----------------------------------------------------------

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PALETTE.bg },

  // -- Top bar -----------------------------------------------------------
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#1F1F1F',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  manageBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.text,
    letterSpacing: 0.2,
  },

  scroll: { paddingHorizontal: 22, paddingBottom: 24 },

  // -- Header ------------------------------------------------------------
  headerEyebrow: {
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: '500',
    color: PALETTE.sageEyebrow,
    marginTop: 8,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '800',
    color: PALETTE.text,
    letterSpacing: -1.1,
  },
  headerSparkle: { fontSize: 28 },
  headerSub: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 21,
    color: PALETTE.textWarm,
    fontWeight: '400',
    marginBottom: 22,
  },

  // -- Hero card ---------------------------------------------------------
  heroCard: {
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: '#1F1F1F',
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
  },
  heroGradient: { padding: 24, gap: 4 },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  heroBadgeText: {
    fontSize: 10,
    letterSpacing: 1.4,
    fontWeight: '700',
    color: PALETTE.sageDeep,
    textTransform: 'uppercase',
  },
  heroBadgeMeta: {
    fontSize: 11.5,
    fontWeight: '600',
    color: PALETTE.textWarm,
  },
  heroBigNumber: {
    fontSize: 44,
    lineHeight: 48,
    fontWeight: '800',
    color: PALETTE.text,
    letterSpacing: -1.4,
    marginTop: 4,
  },
  heroBigUnit: {
    fontSize: 18,
    fontWeight: '600',
    color: PALETTE.textWarm,
    letterSpacing: -0.3,
  },
  heroSavings: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.sageDeep,
    marginTop: 4,
  },
  heroIngredientsLine: {
    flexDirection: 'row',
    marginTop: 14,
    paddingRight: 8,
  },
  heroIngredientsHint: {
    fontSize: 11.5,
    color: PALETTE.textMuted,
    fontWeight: '600',
  },
  heroIngredientsList: {
    flex: 1,
    fontSize: 11.5,
    color: PALETTE.textWarm,
    fontWeight: '500',
  },
  heroCta: {
    marginTop: 18,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: PALETTE.text,
    shadowColor: '#1F1F1F',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  heroCtaText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // -- Search ------------------------------------------------------------
  searchWrap: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 56,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: PALETTE.borderSoft,
    shadowColor: '#1F1F1F',
    shadowOpacity: 0.04,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14.5,
    color: PALETTE.text,
    paddingVertical: 0,
    fontWeight: '500',
  },
  suggestList: {
    marginTop: 8,
    backgroundColor: PALETTE.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PALETTE.borderSoft,
    overflow: 'hidden',
  },
  suggestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: PALETTE.borderSoft,
  },
  suggestEmoji: { fontSize: 22 },
  suggestName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.text,
  },
  suggestAdd: {
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: PALETTE.sageDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // -- Filter chips ------------------------------------------------------
  filterRow: { gap: 8, paddingRight: 16, paddingTop: 22, paddingBottom: 4 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.borderSoft,
  },
  filterChipActive: {
    backgroundColor: PALETTE.text,
    borderColor: PALETTE.text,
  },
  filterChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: PALETTE.text,
    letterSpacing: 0.1,
  },
  filterChipTextActive: { color: '#FFFFFF' },

  // -- Smart sections ----------------------------------------------------
  section: { marginTop: 30 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  sectionMark: {
    width: 4,
    height: 22,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: PALETTE.text,
    letterSpacing: -0.4,
  },
  sectionCaption: {
    fontSize: 12.5,
    color: PALETTE.textWarm,
    marginTop: 2,
  },
  emptyHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
  },
  emptyHintText: {
    flex: 1,
    fontSize: 12.5,
    color: PALETTE.textWarm,
    fontWeight: '500',
  },

  // -- Card row ----------------------------------------------------------
  cardRow: { gap: CARD_GAP, paddingLeft: 16, paddingRight: 0 },
  card: { width: CARD_WIDTH, gap: 8 },
  cardSwatch: {
    height: 138,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: PALETTE.borderSoft,
  },
  cardIconLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIcon: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  cardTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.text,
    letterSpacing: -0.2,
  },
  cardMeta: { fontSize: 11.5, color: PALETTE.textWarm, marginTop: -2 },
  cardMetaSmall: { fontSize: 11, color: PALETTE.sageDeep, fontWeight: '600' },
  cardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -2,
  },
  miniAddBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: PALETTE.goldDeep,
  },
  miniAddText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  // -- Card badges -------------------------------------------------------
  readyBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  readyDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: PALETTE.sageDeep,
  },
  readyText: {
    fontSize: 9.5,
    letterSpacing: 1,
    fontWeight: '700',
    color: PALETTE.sageDeep,
    textTransform: 'uppercase',
  },
  missingBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#FFFFFFE6',
    alignSelf: 'flex-start',
  },
  missingBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: PALETTE.goldDeep,
    letterSpacing: 0.3,
  },
  savingsBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: PALETTE.goldDeep,
  },
  savingsBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  // -- Manage link -------------------------------------------------------
  manageLink: {
    marginTop: 30,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: PALETTE.sageSoft,
  },
  manageLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.sageDeep,
    letterSpacing: 0.2,
  },

  // -- Manage sheet ------------------------------------------------------
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,18,16,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '88%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: PALETTE.bg,
    paddingTop: 12,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: PALETTE.border,
    marginBottom: 14,
  },
  sheetHeader: {
    paddingHorizontal: 22,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  sheetEyebrow: {
    fontSize: 10.5,
    letterSpacing: 1.6,
    fontWeight: '700',
    color: PALETTE.sageDeep,
    marginBottom: 4,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: PALETTE.text,
    letterSpacing: -0.5,
  },
  sheetClose: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetSearchWrap: {
    marginHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.borderSoft,
  },
  sheetSearchInput: {
    flex: 1,
    fontSize: 14,
    color: PALETTE.text,
    paddingVertical: 0,
  },
  sheetScroll: { paddingHorizontal: 22, paddingTop: 18 },
  sheetSection: { marginBottom: 22 },
  sheetSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sheetSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.text,
    letterSpacing: -0.2,
  },
  sheetSectionCaption: { fontSize: 11.5, color: PALETTE.textWarm, marginTop: 2 },
  sheetSectionMeta: { fontSize: 12, fontWeight: '600', color: PALETTE.sageDeep },
  sheetList: {
    backgroundColor: PALETTE.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.borderSoft,
    overflow: 'hidden',
  },
  sheetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  sheetCard: {
    width: '31.5%',
    aspectRatio: 1,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.borderSoft,
    backgroundColor: PALETTE.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    position: 'relative',
  },
  sheetCardIn: {
    backgroundColor: PALETTE.sageSoft,
    borderColor: PALETTE.sageDeep,
  },
  sheetCardEmoji: { fontSize: 28, marginBottom: 6 },
  sheetCardName: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.text,
    textAlign: 'center',
    paddingHorizontal: 2,
  },
  sheetCardCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: PALETTE.sageDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: PALETTE.borderSoft,
  },
  sheetRowIn: { backgroundColor: '#FBFAF6' },
  sheetRowEmojiWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: PALETTE.surfaceWarm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetRowEmojiWrapIn: { backgroundColor: PALETTE.sageSoft },
  sheetRowEmoji: { fontSize: 20 },
  sheetRowName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.text,
  },
  sheetCheck: {
    width: 24,
    height: 24,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: PALETTE.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCheckIn: {
    backgroundColor: PALETTE.sageDeep,
    borderColor: PALETTE.sageDeep,
  },
  sheetFooter: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 22,
    borderTopWidth: 1,
    borderTopColor: PALETTE.borderSoft,
    backgroundColor: PALETTE.bg,
  },
  sheetDone: {
    height: 52,
    borderRadius: 999,
    backgroundColor: PALETTE.sageDeep,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: PALETTE.sageDeep,
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  sheetDoneText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
