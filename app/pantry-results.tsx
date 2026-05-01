// Pantry Magic — "What you can make right now."
//
// Personalized landing screen that scores every recipe against the
// user's pantry (lib/pantry-match.ts) and groups the results into
// three actionable buckets:
//
//   1. Ready to make   — user has every ingredient. Top of the page.
//   2. Almost there    — missing 1–2 ingredients (status === 'almost').
//   3. Explore more    — everything else, capped so the screen stays
//                        scannable; users go to /categories for the full list.
//
// This screen replaces the previous shortcut that sent users to a
// filtered category list (/categories?category=emergency-budget-hacks),
// which had no awareness of the user's pantry at all.

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { recipeHeroImage } from '@/constants/recipeHeroImages';
import { type Recipe } from '@/constants/recipes';
import { useAllRecipes } from '@/constants/recipes-remote';
import { Colors, Radius, Spacing, Type } from '@/constants/theme';
import {
  computeMatch,
  type PantryMatch,
} from '@/lib/pantry-match';
import { usePantry } from '@/lib/pantry-store';

// Cap the Explore section so the page stays readable. Users wanting the
// full catalog can tap through to /categories.
const EXPLORE_LIMIT = 12;

type Scored = { recipe: Recipe; match: PantryMatch };

export default function PantryResults() {
  const recipes = useAllRecipes();
  const pantry = usePantry();

  const buckets = useMemo(() => {
    const ready: Scored[] = [];
    const almost: Scored[] = [];
    const partial: Scored[] = [];
    for (const r of recipes) {
      const match = computeMatch(r.ingredients, pantry);
      const entry: Scored = { recipe: r, match };
      if (match.status === 'ready') ready.push(entry);
      else if (match.status === 'almost') almost.push(entry);
      else partial.push(entry);
    }
    // Highest match ratio first within each bucket.
    const byPercent = (a: Scored, b: Scored) => b.match.percent - a.match.percent;
    ready.sort(byPercent);
    almost.sort(byPercent);
    partial.sort(byPercent);
    return { ready, almost, partial };
  }, [recipes, pantry]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="chevron-back" size={20} color={Colors.light.text} />
        </Pressable>
        <Text style={styles.topTitle}>Pantry Magic</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit pantry"
          onPress={() => router.push('/pantry')}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="create-outline" size={18} color={Colors.light.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroBlock}>
          <Text style={styles.heroEyebrow}>Pantry Magic</Text>
          <Text style={styles.heroTitle}>What you can make now</Text>
          <Text style={styles.heroSub}>
            Based on your pantry of {pantry.size}{' '}
            {pantry.size === 1 ? 'item' : 'items'}
          </Text>
          <Pressable
            onPress={() => router.push('/pantry')}
            style={({ pressed }) => [
              styles.editLink,
              pressed && { opacity: 0.6 },
            ]}
          >
            <Ionicons
              name="add-circle-outline"
              size={14}
              color={Colors.light.sageDeep}
            />
            <Text style={styles.editLinkText}>Edit pantry</Text>
          </Pressable>
        </View>

        <Section
          title="Ready to make"
          caption="You have everything you need"
          accent="ready"
          count={buckets.ready.length}
        >
          {buckets.ready.length === 0 ? (
            <EmptyReady pantrySize={pantry.size} />
          ) : (
            buckets.ready.map((s) => (
              <RecipeRow key={s.recipe.id} scored={s} />
            ))
          )}
        </Section>

        {buckets.almost.length > 0 ? (
          <Section
            title="Almost there"
            caption="Missing just a couple of items"
            accent="almost"
            count={buckets.almost.length}
          >
            {buckets.almost.map((s) => (
              <RecipeRow key={s.recipe.id} scored={s} />
            ))}
          </Section>
        ) : null}

        {buckets.partial.length > 0 ? (
          <Section
            title="Explore more"
            caption="Worth stocking up for"
            count={Math.min(buckets.partial.length, EXPLORE_LIMIT)}
          >
            {buckets.partial.slice(0, EXPLORE_LIMIT).map((s) => (
              <RecipeRow key={s.recipe.id} scored={s} />
            ))}
            {buckets.partial.length > EXPLORE_LIMIT ? (
              <Pressable
                onPress={() => router.push('/categories')}
                style={({ pressed }) => [
                  styles.seeMore,
                  pressed && { opacity: 0.6 },
                ]}
              >
                <Text style={styles.seeMoreText}>
                  See all {buckets.partial.length} more recipes
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={14}
                  color={Colors.light.sageDeep}
                />
              </Pressable>
            ) : null}
          </Section>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

// =============================================================================
// Section
// =============================================================================

function Section({
  title,
  caption,
  accent,
  count,
  children,
}: {
  title: string;
  caption: string;
  accent?: 'ready' | 'almost';
  count: number;
  children: React.ReactNode;
}) {
  const dotStyle = [
    styles.sectionDot,
    accent === 'ready' && styles.sectionDotReady,
    accent === 'almost' && styles.sectionDotAlmost,
  ];
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <View style={dotStyle} />
          <Text style={styles.sectionTitle}>{title}</Text>
          {count > 0 ? (
            <Text style={styles.sectionCount}>{count}</Text>
          ) : null}
        </View>
        <Text style={styles.sectionCaption}>{caption}</Text>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

// =============================================================================
// Row
// =============================================================================

function RecipeRow({ scored }: { scored: Scored }) {
  const { recipe, match } = scored;
  const matchLine =
    match.status === 'ready'
      ? `Ready · ${match.total} ingredient${match.total === 1 ? '' : 's'}`
      : `${match.matched.length} of ${match.total} ingredients`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${recipe.title}`}
      onPress={() =>
        router.push({ pathname: '/result', params: { id: recipe.id } })
      }
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.92 }]}
    >
      <Image
        source={recipeHeroImage(recipe.id, recipe.categoryKey)}
        testID="pc-recipe-icon"
        style={styles.rowImage}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
      <View style={styles.rowText}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {recipe.title}
        </Text>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {recipe.time} • {recipe.categoryLabel}
        </Text>
        <View style={styles.rowMatch}>
          <View
            style={[
              styles.matchDot,
              match.status === 'ready' && styles.matchDotReady,
              match.status === 'almost' && styles.matchDotAlmost,
              match.status === 'partial' && styles.matchDotPartial,
            ]}
          />
          <Text
            style={[
              styles.rowMatchText,
              match.status === 'ready' && styles.rowMatchTextReady,
            ]}
          >
            {matchLine}
          </Text>
        </View>
      </View>
      <Ionicons
        name="chevron-forward"
        size={18}
        color={Colors.light.textSubtle}
      />
    </Pressable>
  );
}

// =============================================================================
// Empty state for the Ready section
// =============================================================================

function EmptyReady({ pantrySize }: { pantrySize: number }) {
  const isEmpty = pantrySize === 0;
  return (
    <View style={styles.emptyReady}>
      <View style={styles.emptyMark}>
        <Ionicons
          name="basket-outline"
          size={20}
          color={Colors.light.sageDeep}
        />
      </View>
      <Text style={styles.emptyTitle}>
        {isEmpty ? 'Set up your pantry first' : 'Nothing matches yet'}
      </Text>
      <Text style={styles.emptyBody}>
        {isEmpty
          ? 'Tell us what you have on hand and we’ll show recipes you can make right now.'
          : 'Add a few more staples and ready-to-make recipes will appear here automatically.'}
      </Text>
      <Pressable
        onPress={() => router.push('/pantry')}
        style={({ pressed }) => [
          styles.emptyCta,
          pressed && { opacity: 0.92 },
        ]}
      >
        <Text style={styles.emptyCtaText}>
          {isEmpty ? 'Set up pantry' : 'Add pantry items'}
        </Text>
        <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================

const ROW_IMAGE_SIZE = 64;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  topTitle: { ...Type.bodyStrong, color: Colors.light.text },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },

  heroBlock: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  heroEyebrow: {
    ...Type.caption,
    color: Colors.light.sageDeep,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.light.text,
    letterSpacing: -0.4,
    marginTop: 6,
  },
  heroSub: {
    ...Type.body,
    color: Colors.light.textMuted,
    marginTop: 4,
  },
  editLink: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  editLinkText: {
    ...Type.caption,
    color: Colors.light.sageDeep,
    fontWeight: '600',
  },

  section: { marginTop: Spacing.xl },
  sectionHeader: { marginBottom: Spacing.md },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: Colors.light.textSubtle,
  },
  sectionDotReady: { backgroundColor: Colors.light.sageDeep },
  sectionDotAlmost: { backgroundColor: Colors.light.gold },
  sectionTitle: {
    ...Type.sectionTitle,
    color: Colors.light.text,
  },
  sectionCount: {
    ...Type.caption,
    color: Colors.light.textMuted,
    backgroundColor: Colors.light.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
  },
  sectionCaption: {
    ...Type.caption,
    color: Colors.light.textMuted,
    marginTop: 2,
    marginLeft: 16,
  },
  sectionBody: { gap: Spacing.sm },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  rowImage: {
    width: ROW_IMAGE_SIZE,
    height: ROW_IMAGE_SIZE,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surfaceAlt,
  },
  rowText: { flex: 1, gap: 2 },
  rowTitle: {
    ...Type.bodyStrong,
    color: Colors.light.text,
  },
  rowMeta: {
    ...Type.caption,
    color: Colors.light.textMuted,
  },
  rowMatch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  matchDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: Colors.light.textSubtle,
  },
  matchDotReady: { backgroundColor: Colors.light.sageDeep },
  matchDotAlmost: { backgroundColor: Colors.light.gold },
  matchDotPartial: { backgroundColor: Colors.light.textSubtle },
  rowMatchText: {
    ...Type.caption,
    color: Colors.light.textMuted,
  },
  rowMatchTextReady: {
    color: Colors.light.sageDeep,
    fontWeight: '600',
  },

  seeMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.md,
    marginTop: 4,
  },
  seeMoreText: {
    ...Type.caption,
    color: Colors.light.sageDeep,
    fontWeight: '600',
  },

  emptyReady: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyMark: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: Colors.light.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    ...Type.sectionTitle,
    color: Colors.light.text,
    textAlign: 'center',
  },
  emptyBody: {
    ...Type.body,
    color: Colors.light.textMuted,
    textAlign: 'center',
    marginTop: 6,
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.sageDeep,
  },
  emptyCtaText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
