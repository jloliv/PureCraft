import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MakeNav } from '@/components/make-nav';
import { tapLight } from '@/lib/haptics';
import { SavingsDashboard } from '@/components/savings-dashboard';
import { formatMoney, useCurrency } from '@/constants/currency';
import { PRODUCTS, type Product } from '@/constants/products';
import { useAllRecipes } from '@/constants/recipes-remote';
import { useAuth } from '@/lib/auth';
import { recipeIcon as iconFor, RECIPE_ICON_BLEND } from '@/lib/recipe-icons';
import { useRecentRecipes } from '@/lib/recent-recipes';
import { useSavedRecipes } from '@/lib/saved-recipes';
import {
  type Collection as StoredCollection,
  createCollection,
  FAVORITES_ID,
  useCollections,
} from '@/lib/collections-store';

const PALETTE = {
  bg: '#F8F6F1',
  text: '#1F1F1F',
  textMuted: '#6F6A60',
  textSubtle: '#A8A398',
  surface: '#FFFFFF',
  surfaceWarm: '#F1ECE0',
  border: '#E8E2D2',
  sage: '#A8B8A0',
  sageDeep: '#7E8F75',
  sageSoft: '#E4EDE5',
  cream: '#F7F2E7',
  creamDeep: '#EFE7D2',
  gold: '#C7A96B',
  goldDeep: '#A98A4D',
  rose: '#C26B5A',
};

type SavedItem = {
  product: Product;
  madeCount: number;
  lastMade: string;
  totalSavedUsd: number;
  premium?: boolean;
  custom?: boolean;
};

// --- Live → SavedItem adapter ------------------------------------------------
//
// `saved_recipes` rows reference recipe IDs. For hero recipes (in PRODUCTS)
// we wire in the full Product. For AI/user-generated recipes that don't
// exist in PRODUCTS, we synthesize a minimal Product-shape from the
// remote recipe row so the same renderer works across both sources.

function timeAgo(iso: string | null): string {
  if (!iso) return 'Just saved';
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

// Fallback hero data so the "empty state" demo still feels alive when the
// user hasn't saved anything yet.
const DEMO_FALLBACK: SavedItem[] = [
  { product: PRODUCTS.find((p) => p.id === 'bathroom-cleaner')!, madeCount: 4, lastMade: '2 days ago', totalSavedUsd: 12.80 },
  { product: PRODUCTS.find((p) => p.id === 'kitchen-spray')!, madeCount: 3, lastMade: 'Last week', totalSavedUsd: 11.40 },
  { product: PRODUCTS.find((p) => p.id === 'sugar-scrub')!, madeCount: 2, lastMade: '3 weeks ago', totalSavedUsd: 17.00, premium: true },
  { product: PRODUCTS.find((p) => p.id === 'linen-spray')!, madeCount: 2, lastMade: 'Last month', totalSavedUsd: 10.20 },
  { product: PRODUCTS.find((p) => p.id === 'body-butter')!, madeCount: 1, lastMade: 'Last month', totalSavedUsd: 11.00, premium: true, custom: true },
  { product: PRODUCTS.find((p) => p.id === 'glass-cleaner')!, madeCount: 1, lastMade: '2 months ago', totalSavedUsd: 2.40 },
];

// "Custom" used to live here too, but the bottom of the screen now has
// dedicated "Saved" and "My Recipes" sections so the chip is redundant.
// Removing it keeps the chip row from offering two ways to do the same
// thing.
const FILTERS = ['All', 'Favorites', 'Cleaning', 'Beauty', 'Home', 'Premium'] as const;
type Filter = (typeof FILTERS)[number];

// CollectionView is the display-shape derived from a StoredCollection
// in lib/collections-store. The store keeps only stable data (id, name,
// recipeIds, createdAt); the visual decoration (accent/icon/sub copy)
// is assigned at render time so future palette tweaks don't require a
// data migration.
type CollectionView = {
  id: string;
  name: string;
  count: number;
  sub: string;
  accent: string;
  accentDeep: string;
  icon: keyof typeof Ionicons.glyphMap;
};

// Legacy demo seed — kept around for reference, no longer rendered.
// The real source of truth is now lib/collections-store. Safe to
// delete on the next pass.
type DemoCollection = CollectionView & { key: string };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const DEMO_COLLECTIONS: DemoCollection[] = [
  {
    key: 'spring-reset',
    name: 'Spring Reset',
    count: 8,
    sub: 'Pollen, dust, fresh air',
    accent: '#E4EDE5',
    accentDeep: '#7E8F75',
    icon: 'flower-outline',
  },
  {
    key: 'weekly-staples',
    name: 'Weekly Staples',
    count: 12,
    sub: 'The non-negotiables',
    accent: '#F7F2E7',
    accentDeep: '#A98A4D',
    icon: 'leaf-outline',
  },
  {
    key: 'self-care',
    name: 'Self Care Sundays',
    count: 6,
    sub: 'Slow routines',
    accent: '#F1ECE0',
    accentDeep: '#9C7A4F',
    icon: 'sparkles-outline',
  },
  {
    key: 'baby-safe',
    name: 'Baby Safe Home',
    count: 5,
    sub: 'Tiny-hands approved',
    accent: '#EAF1F4',
    accentDeep: '#4F7186',
    icon: 'happy-outline',
  },
];

// Cycle these accents for new collections so they look intentional, not random.
const NEW_COLLECTION_ACCENTS: Array<Pick<CollectionView, 'accent' | 'accentDeep' | 'icon'>> = [
  { accent: '#EFE7D2', accentDeep: '#A98A4D', icon: 'star-outline' },
  { accent: '#E8F0EA', accentDeep: '#5F876A', icon: 'leaf-outline' },
  { accent: '#F4EAD5', accentDeep: '#8B6A2F', icon: 'flame-outline' },
  { accent: '#ECE7F2', accentDeep: '#6F5FA3', icon: 'sparkles-outline' },
];

// Decorate a stored Collection with display-only fields (accent / icon /
// sub copy). Favorites gets a special heart-shaped treatment; all other
// collections cycle through NEW_COLLECTION_ACCENTS by index so they
// look intentional instead of randomly themed.
function decorateCollection(c: StoredCollection, index: number): CollectionView {
  if (c.id === FAVORITES_ID) {
    return {
      id: c.id,
      name: c.name,
      count: c.recipeIds.length,
      sub: 'Your hand-picked favorites',
      accent: '#FCE9E1',
      accentDeep: '#C26B5A',
      icon: 'heart-outline',
    };
  }
  const palette = NEW_COLLECTION_ACCENTS[index % NEW_COLLECTION_ACCENTS.length];
  return {
    id: c.id,
    name: c.name,
    count: c.recipeIds.length,
    sub:
      c.recipeIds.length === 0
        ? 'Empty — add recipes from a card'
        : `${c.recipeIds.length === 1 ? 'recipe' : 'recipes'} saved`,
    ...palette,
  };
}

export default function Saved() {
  const { currency } = useCurrency();
  const [filter, setFilter] = useState<Filter>('All');
  // Real, persisted collections from lib/collections-store. Decorated
  // with accent/icon below for the grid render. Falsey "isHydrated" on
  // first launch falls back to the demo seed so the screen doesn't
  // flicker an empty grid before storage hydrates.
  const storedCollections = useCollections();
  const collections = useMemo<CollectionView[]>(() => {
    return storedCollections.map((c, i) => decorateCollection(c, i));
  }, [storedCollections]);
  const [createOpen, setCreateOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const { user } = useAuth();
  const { saved: savedMap } = useSavedRecipes();
  const allRecipes = useAllRecipes();

  // Build live SavedItem[] from the joined saved_recipes × recipes data.
  // Recipes that map cleanly to a hero Product use the rich PRODUCTS row;
  // others (AI / user-generated) use a synthetic minimal Product.
  const liveSaved = useMemo<SavedItem[]>(() => {
    const out: SavedItem[] = [];
    for (const [recipeId, save] of savedMap) {
      const product =
        PRODUCTS.find((p) => p.id === recipeId) ??
        (() => {
          const recipe = allRecipes.find((r) => r.id === recipeId);
          if (!recipe) return null;
          // Synthesize a Product shape so the existing card renderer works.
          // The 'group' has to be one of cleaning|beauty|home so filters land.
          const group: Product['group'] =
            recipe.categoryKey === 'cleaning' || recipe.categoryKey === 'laundry'
              ? 'cleaning'
              : recipe.categoryKey === 'beauty-skincare' ||
                  recipe.categoryKey === 'hair-care'
                ? 'beauty'
                : 'home';
          return {
            id: recipe.id,
            title: recipe.title,
            group,
            time: recipe.time,
            difficulty: recipe.difficulty,
            tags: recipe.tags,
            blurb: recipe.title,
            // Placeholder visuals — eventually we render recipeIcon by id.
            swatch: '#F1ECE0',
            colorAccent: '#A8B8A0',
            accent: '#A8B8A0',
            emoji: '✨',
            savingsUsd: 0,
            storeBoughtUsd: 0,
          } as unknown as Product;
        })();
      if (!product) continue;
      out.push({
        product,
        madeCount: save.made_count,
        lastMade: timeAgo(save.last_made ?? save.saved_at),
        totalSavedUsd: (product.savingsUsd ?? 0) * Math.max(1, save.made_count),
        custom: !PRODUCTS.find((p) => p.id === recipeId),
      });
    }
    return out.sort((a, b) => b.madeCount - a.madeCount);
  }, [savedMap, allRecipes]);

  // Show demo fallback when signed out OR when signed in but no saves yet
  // (so the screen has visual life). Once they save something real, demo
  // disappears.
  const baseList = !user || liveSaved.length === 0 ? DEMO_FALLBACK : liveSaved;

  const filtered = useMemo(() => {
    if (filter === 'All') return baseList;
    if (filter === 'Favorites') return baseList.filter((s) => s.madeCount >= 2);
    if (filter === 'Premium') return baseList.filter((s) => s.premium);
    const groupKey = filter.toLowerCase();
    return baseList.filter((s) => s.product.group === groupKey);
  }, [filter, baseList]);

  // Split into Saved (browsed-and-bookmarked) vs My Recipes (created
  // by the user). Same source list and same filter chips apply to
  // both, so toggling "Cleaning" trims both sections; the chips affect
  // the visible subset, the section split affects the grouping.
  const savedItems = useMemo(
    () => filtered.filter((s) => !s.custom),
    [filtered],
  );
  const myItems = useMemo(
    () => filtered.filter((s) => s.custom),
    [filtered],
  );

  const recent = [...baseList].slice(0, 5);
  // Last-10-viewed list, persisted via AsyncStorage. Falls back to the
  // saved-fallback list when there's no view history yet.
  const recentIds = useRecentRecipes();
  const recentlyViewed = useMemo(() => {
    if (recentIds.length === 0) return recent;
    return recentIds
      .slice(0, 5)
      .map((id) => {
        const product = PRODUCTS.find((p) => p.id === id);
        if (!product) return null;
        // Reuse the SavedItem shape so the existing card renderer works.
        return {
          product,
          madeCount: 0,
          lastMade: 'Recently viewed',
          totalSavedUsd: product.savingsUsd ?? 0,
        };
      })
      .filter((x): x is SavedItem => x !== null);
  }, [recentIds, recent]);
  // Per-section empty-states drive their own copy/CTA now — see the
  // Saved + My Recipes blocks below — so we no longer need a screen-
  // wide isEmpty flag.
  const CONTINUE_MAKING = baseList[0];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Background-image hero — photo fills the entire card and a
            left-to-right gradient (cream-95% -> cream-60% -> clear)
            lightens the left third so the title reads cleanly while
            the right edge keeps the lifestyle scene visible. Removes
            the previous split/boxed look so the surface feels
            editorial, not utility. Swap comfort.jpg for a dedicated
            'saved-library' shot when one is generated. */}
        <View style={styles.heroContainer}>
          <Image
            source={require('../assets/images/comfort.jpg')}
            style={styles.heroImage}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
          <LinearGradient
            colors={[
              'rgba(248,246,241,0.95)',
              'rgba(248,246,241,0.6)',
              'transparent',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={styles.heroContent}>
            <Text style={styles.heroLabel}>LIBRARY</Text>
            {/* Header reads as a personal space, not a generic bookmark
                bin — and explicitly DOESN'T repeat the section names
                ("Saved", "My Recipes") that appear below it. */}
            <Text style={styles.heroTitle}>Your Collection</Text>
            <Text style={styles.heroSubtitle}>
              Your curated PureCraft collection
            </Text>
          </View>
        </View>

        {/* Search row — taller pills (56) sit directly under the hero
            with consistent 18pt top spacing. Both are no-ops for now
            to match the previous header's behavior; wire up real
            search/sort here when the saved-list filter UX ships. */}
        <View style={styles.searchRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Search saved recipes"
            onPress={() => {}}
            style={({ pressed }) => [
              styles.searchBar,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Ionicons name="search" size={18} color={PALETTE.textSubtle} />
            <Text style={styles.searchText}>Search your saved recipes</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Filter"
            onPress={() => {}}
            style={({ pressed }) => [
              styles.filterButton,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Ionicons name="options-outline" size={20} color={PALETTE.text} />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map((f) => {
            const isActive = filter === f;
            return (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                style={({ pressed }) => [
                  styles.chip,
                  isActive && styles.chipActive,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{f}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <SavingsDashboard onPressBreakdown={() => {}} />

        <ContinueMakingCard item={CONTINUE_MAKING} currencySymbol={currency.symbol} />

        <SectionHeader
          title="Your collections"
          caption="Group recipes by routine"
          actionLabel="New collection"
          onAction={() => {
            tapLight();
            setNewCollectionName('');
            setCreateOpen(true);
          }}
        />
        <View style={styles.collectionsGrid}>
          {collections.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => {
                tapLight();
                router.push({
                  pathname: '/collection',
                  params: { id: c.id },
                });
              }}
              style={({ pressed }) => [
                styles.collectionCard,
                pressed && styles.cardPressed,
              ]}
            >
              <View style={[styles.collectionStack, { backgroundColor: c.accent }]}>
                <View style={[styles.stackBack, { backgroundColor: '#FFFFFF80' }]} />
                <View style={[styles.stackMid, { backgroundColor: '#FFFFFFB0' }]} />
                <View style={[styles.stackFront, { backgroundColor: '#FFFFFF' }]}>
                  <Ionicons name={c.icon} size={22} color={c.accentDeep} />
                </View>
              </View>
              <View style={styles.collectionBody}>
                <Text style={styles.collectionName}>{c.name}</Text>
                <Text style={styles.collectionMeta}>
                  {c.count} recipes · {c.sub}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        <SectionHeader
          title="Recently viewed"
          caption={
            recentIds.length > 0
              ? `Your last ${Math.min(recentIds.length, 5)}`
              : 'Your last 5'
          }
          actionLabel="View all"
          onAction={() => setFilter('All')}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recentRow}
        >
          {recentlyViewed.map((s) => (
            <Pressable
              key={s.product.id}
              onPress={() => router.push({ pathname: '/result', params: { id: s.product.id } })}
              style={({ pressed }) => [styles.recentCard, pressed && styles.cardPressed]}
            >
              <View style={[styles.recentSwatch, { backgroundColor: s.product.swatch }]}>
                <Image
                  source={iconFor(s.product.id)}
                  testID="pc-recipe-icon"
                  style={[styles.recentIcon, RECIPE_ICON_BLEND]}
                  resizeMode="cover"
                />
                <View style={styles.heartChip}>
                  <Ionicons name="heart" size={10} color={PALETTE.rose} />
                </View>
              </View>
              <Text style={styles.recentTitle} numberOfLines={1}>
                {s.product.title}
              </Text>
              <Text style={styles.recentMeta}>{s.lastMade}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* ============================== Saved ============================ */}
        {/* Recipes the user has bookmarked from the catalog. Distinct
            from the user's own creations so the two streams don't fight
            for attention as the library grows. */}
        <SectionHeader
          title="Saved"
          caption={`${savedItems.length} ${savedItems.length === 1 ? 'recipe' : 'recipes'}`}
        />
        {savedItems.length === 0 ? (
          <EmptyState onBrowse={() => router.push('/discover')} />
        ) : (
          <View style={styles.grid}>
            {savedItems.map((s) => (
              <SavedCard
                key={s.product.id}
                item={s}
                currencySymbol={currency.symbol}
              />
            ))}
          </View>
        )}

        {/* ============================ My Recipes ========================== */}
        {/* User-created recipes (custom: true on SavedItem). Empty state
            converts the section from "missing data" into a creation
            prompt — that's the entire point of separating the two
            lists. */}
        <SectionHeader
          title="My Recipes"
          caption={`${myItems.length} ${myItems.length === 1 ? 'recipe' : 'recipes'}`}
        />
        {myItems.length === 0 ? (
          <MyRecipesEmptyState
            onCreate={() => {
              tapLight();
              router.push('/my-recipe');
            }}
          />
        ) : (
          <View style={styles.grid}>
            {myItems.map((s) => (
              <SavedCard
                key={s.product.id}
                item={s}
                currencySymbol={currency.symbol}
              />
            ))}
          </View>
        )}

        <View style={{ height: 112 }} />
      </ScrollView>

      <MakeNav active="saved" />

      <Modal
        animationType="fade"
        transparent
        visible={createOpen}
        onRequestClose={() => setCreateOpen(false)}
      >
        <View style={styles.createBackdrop}>
          <View style={styles.createCard}>
            <Text style={styles.createTitle}>New collection</Text>
            <Text style={styles.createSub}>
              Group recipes by routine, season, or person.
            </Text>
            <TextInput
              autoFocus
              value={newCollectionName}
              onChangeText={setNewCollectionName}
              placeholder="Collection name"
              placeholderTextColor={PALETTE.textSubtle}
              style={styles.createInput}
              returnKeyType="done"
              onSubmitEditing={() => {
                const name = newCollectionName.trim();
                if (!name) return;
                tapLight();
                // createCollection persists to AsyncStorage and emits
                // an update so the grid + the save-to-collection sheet
                // both pick up the new entry on the next render.
                void createCollection(name);
                setNewCollectionName('');
                setCreateOpen(false);
              }}
            />
            <View style={styles.createActions}>
              <Pressable
                onPress={() => {
                  setCreateOpen(false);
                  setNewCollectionName('');
                }}
                style={styles.createGhost}
              >
                <Text style={styles.createGhostText}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={newCollectionName.trim().length === 0}
                onPress={() => {
                  const name = newCollectionName.trim();
                  if (!name) return;
                  tapLight();
                  void createCollection(name);
                  setNewCollectionName('');
                  setCreateOpen(false);
                }}
                style={({ pressed }) => [
                  styles.createSave,
                  newCollectionName.trim().length === 0 && { opacity: 0.45 },
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text style={styles.createSaveText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function ContinueMakingCard({
  item,
  currencySymbol,
}: {
  item: SavedItem;
  currencySymbol: string;
}) {
  // Premium hero-card layout: full-bleed image on the left, soft fade
  // into cream on the right, label + title + meta stacked over the
  // fade. The Pressable wrapping the whole card already navigates to
  // /result, so the explicit "Resume" CTA was redundant — tapping
  // anywhere on the card resumes.
  const savings = item.product.savingsUsd ?? 0;
  const savingsLabel =
    savings > 0 ? `${currencySymbol}${savings.toFixed(2)}` : null;
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/result', params: { id: item.product.id } })}
      style={({ pressed }) => [styles.continueWrap, pressed && { opacity: 0.96 }]}
    >
      <View style={styles.continueCard}>
        <Image
          source={iconFor(item.product.id)}
          style={styles.continueImage}
          resizeMode="cover"
        />
        <View style={styles.continueText}>
          <Text style={styles.continueBadgeText}>You&apos;re making</Text>
          <Text style={styles.continueTitle} numberOfLines={1}>
            {item.product.title}
          </Text>
          <Text style={styles.continueMeta} numberOfLines={1}>
            {item.product.time}
            {savingsLabel ? ` • save ${savingsLabel}` : ''}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function SavedCard({
  item,
  currencySymbol: _,
}: {
  item: SavedItem;
  currencySymbol: string;
}) {
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/result', params: { id: item.product.id } })}
      style={({ pressed }) => [styles.gridCard, pressed && styles.cardPressed]}
    >
      <View style={[styles.gridSwatch, { backgroundColor: item.product.swatch }]}>
        <Image
          source={iconFor(item.product.id)}
          testID="pc-recipe-icon"
          style={[styles.gridIcon, RECIPE_ICON_BLEND]}
          resizeMode="cover"
        />
        <View style={styles.gridTopRow}>
          {item.premium ? (
            <View style={styles.premiumBadge}>
              <Ionicons name="sparkles" size={10} color={PALETTE.goldDeep} />
              <Text style={styles.premiumBadgeText}>Premium</Text>
            </View>
          ) : (
            <View style={{ width: 1 }} />
          )}
          <View style={styles.heartBadge}>
            <Ionicons name="heart" size={11} color={PALETTE.rose} />
          </View>
        </View>
      </View>
      <View style={styles.gridBody}>
        <Text style={styles.gridTitle} numberOfLines={1}>
          {item.product.title}
        </Text>
        <Text style={styles.gridMeta}>
          Made {item.madeCount}× · {item.lastMade}
        </Text>
      </View>
    </Pressable>
  );
}

function EmptyState({ onBrowse }: { onBrowse: () => void }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyMark}>
        <Ionicons name="bookmark-outline" size={26} color={PALETTE.sageDeep} />
      </View>
      <Text style={styles.emptyTitle}>Nothing saved here yet</Text>
      <Text style={styles.emptyBody}>
        Tap the heart on any recipe and it lands here.{`\n`}Build a library you&apos;ll actually use.
      </Text>
      <Pressable
        onPress={onBrowse}
        style={({ pressed }) => [styles.emptyCta, pressed && { opacity: 0.92 }]}
      >
        <Text style={styles.emptyCtaText}>Browse Discover</Text>
        <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

// Shown when the My Recipes section is empty. Doubles as the entry
// point into /my-recipe for first-time creators — the CTA copy ("Create
// your first recipe") is what makes this screen feel intentional
// rather than just "no data."
function MyRecipesEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyMark}>
        <Ionicons name="flask-outline" size={26} color={PALETTE.sageDeep} />
      </View>
      <Text style={styles.emptyTitle}>You haven’t created any recipes yet</Text>
      <Text style={styles.emptyBody}>
        Capture a formula you love, scan a label, or build one from scratch — they all land here.
      </Text>
      <Pressable
        onPress={onCreate}
        style={({ pressed }) => [styles.emptyCta, pressed && { opacity: 0.92 }]}
      >
        <Text style={styles.emptyCtaText}>Create your first recipe</Text>
        <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

function SectionHeader({
  title,
  caption,
  actionLabel,
  onAction,
}: {
  title: string;
  caption?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {caption ? <Text style={styles.sectionCaption}>{caption}</Text> : null}
      </View>
      {actionLabel ? (
        <Pressable hitSlop={8} onPress={onAction}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PALETTE.bg },
  scroll: { paddingHorizontal: 20, paddingBottom: 24 },

  createBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 20, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  createCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
  },
  createTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: PALETTE.text,
    letterSpacing: -0.3,
  },
  createSub: {
    fontSize: 13.5,
    color: PALETTE.textMuted,
    lineHeight: 19,
    marginTop: 6,
    marginBottom: 18,
  },
  createInput: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 16,
    fontSize: 15,
    color: PALETTE.text,
    backgroundColor: '#FAF7F0',
  },
  createActions: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  createGhost: { paddingHorizontal: 16, paddingVertical: 12 },
  createGhostText: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.textMuted,
  },
  createSave: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: PALETTE.sageDeep,
  },
  createSaveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Editorial-style hero: photo fills the entire card; a left-to-
  // right gradient (cream-95% -> cream-60% -> clear) lightens the
  // left third so the title reads cleanly while the lifestyle scene
  // stays visible on the right. The container relies on the parent
  // ScrollView's paddingHorizontal: 20 for its outer inset (matches
  // the spec's marginHorizontal: 16 intent — 20pt is close enough
  // and keeps every other top-level child aligned).
  heroContainer: {
    height: 160,
    marginTop: 16,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#F8F6F1',
    position: 'relative',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  heroLabel: {
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: '700',
    color: '#6F8A73',
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1E1E1E',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#6B6B6B',
    marginTop: 4,
  },

  // Search + filter row. Taller (56) pill controls with 12pt gap.
  // marginHorizontal is 0 because the parent ScrollView already
  // contributes the 20pt inset the spec calls for.
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 12,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F7F6F1',
    paddingHorizontal: 18,
  },
  searchText: {
    color: PALETTE.textSubtle,
    fontSize: 15,
  },
  filterButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F7F6F1',
    justifyContent: 'center',
    alignItems: 'center',
  },

  filterRow: { gap: 8, paddingRight: 12 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  chipActive: { backgroundColor: PALETTE.sageDeep, borderColor: PALETTE.sageDeep },
  chipText: { fontSize: 12.5, fontWeight: '600', color: PALETTE.text },
  chipTextActive: { color: '#FFFFFF' },

  continueWrap: {
    marginTop: 18,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#1F1F1F',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  continueCard: {
    height: 120,
    borderRadius: 20,
    backgroundColor: '#F1ECE0',
    position: 'relative',
    overflow: 'hidden',
  },
  continueImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    // Image takes the left 40% of the card (shrunk from 50%) so the
    // recipe title gets more horizontal breathing room on the right.
    width: '40%',
    height: '100%',
  },
  continueText: {
    position: 'absolute',
    right: 18,
    top: 16,
    bottom: 16,
    // Text starts at x:40% (the image's right edge). 60% of the card
    // width minus paddings gives the headline ~176pt of room — long
    // titles fit comfortably on one line at 18pt.
    left: '40%',
    paddingLeft: 16,
    justifyContent: 'center',
  },
  continueBadgeText: {
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: '700',
    color: PALETTE.textMuted,
    textTransform: 'uppercase',
  },
  continueTitle: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
    color: PALETTE.text,
    letterSpacing: -0.3,
    marginTop: 6,
  },
  continueMeta: {
    fontSize: 12,
    color: PALETTE.textMuted,
    marginTop: 4,
  },
  continueSwatch: {
    width: 96,
    height: 96,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
    overflow: 'hidden',
    position: 'relative',
  },
  continueEmoji: { fontSize: 42 },
  continueIcon: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  iconLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionHeader: {
    marginTop: 30,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.text,
    letterSpacing: -0.3,
  },
  sectionCaption: { fontSize: 12, color: PALETTE.textMuted, marginTop: 2 },
  sectionAction: { fontSize: 12.5, fontWeight: '600', color: PALETTE.goldDeep },

  collectionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  collectionCard: {
    width: '48%',
    borderRadius: 20,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
    overflow: 'hidden',
    shadowColor: '#1F1F1F',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  collectionStack: {
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  stackBack: {
    position: 'absolute',
    width: 64,
    height: 78,
    borderRadius: 14,
    transform: [{ rotate: '-7deg' }, { translateX: -10 }, { translateY: 4 }],
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  stackMid: {
    position: 'absolute',
    width: 64,
    height: 78,
    borderRadius: 14,
    transform: [{ rotate: '5deg' }, { translateX: 8 }, { translateY: 2 }],
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  stackFront: {
    width: 64,
    height: 78,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#1F1F1F',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  collectionBody: { padding: 14, gap: 2 },
  collectionName: { fontSize: 14, fontWeight: '700', color: PALETTE.text },
  collectionMeta: { fontSize: 11.5, color: PALETTE.textMuted },

  recentRow: { gap: 12, paddingRight: 12 },
  recentCard: { width: 140, gap: 8 },
  recentSwatch: {
    height: 130,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PALETTE.border,
    position: 'relative',
    overflow: 'hidden',
  },
  recentEmoji: { fontSize: 36 },
  recentIcon: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  heartChip: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  recentTitle: { fontSize: 12.5, fontWeight: '700', color: PALETTE.text },
  recentMeta: { fontSize: 11, color: PALETTE.textMuted, marginTop: -2 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridCard: {
    width: '48%',
    borderRadius: 20,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
    overflow: 'hidden',
    shadowColor: '#1F1F1F',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  gridSwatch: {
    height: 140,
    position: 'relative',
    overflow: 'hidden',
  },
  gridTopRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  gridEmoji: { fontSize: 38, alignSelf: 'flex-start' },
  gridIcon: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#FFFFFFE6',
    borderWidth: 1,
    borderColor: PALETTE.creamDeep,
  },
  premiumBadgeText: {
    fontSize: 9,
    letterSpacing: 0.7,
    fontWeight: '700',
    color: PALETTE.goldDeep,
    textTransform: 'uppercase',
  },
  heartBadge: {
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  gridBody: { padding: 12, gap: 4 },
  gridTitle: { fontSize: 13.5, fontWeight: '700', color: PALETTE.text },
  gridMeta: { fontSize: 11, color: PALETTE.textMuted },

  empty: {
    alignItems: 'center',
    paddingTop: 36,
    paddingBottom: 24,
    paddingHorizontal: 12,
    gap: 12,
  },
  emptyMark: {
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: PALETTE.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PALETTE.sage,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.text,
    letterSpacing: -0.3,
    marginTop: 6,
  },
  emptyBody: {
    fontSize: 13,
    lineHeight: 18,
    color: PALETTE.textMuted,
    textAlign: 'center',
  },
  emptyCta: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: PALETTE.sageDeep,
  },
  emptyCtaText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.3 },

  cardPressed: { transform: [{ scale: 0.98 }] },
});
