// Collection detail screen — shows the recipes inside one collection
// from /saved. Reached via router.push({ pathname: '/collection',
// params: { id: <collectionId> } }) from the collection cards on
// the Saved screen.
//
// Why a dedicated screen vs. a Saved-screen filter: collections are
// the user's own organizational structure ("Bathroom routine",
// "Weekend cleaning"), and tapping into one should feel like opening
// a folder, not switching a chip. Distinct route also gives us URL
// shareability and clean back-navigation.
//
// Recipe resolution mirrors saved.tsx — recipeIds are matched against
// PRODUCTS first (rich hero data), then synthesized from useAllRecipes
// when the recipe is AI / user-generated. So a freshly-curated
// collection works whether its members are launch recipes or custom.

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TopBar } from '@/components/top-bar';
import { PRODUCTS, type Product } from '@/constants/products';
import { useAllRecipes } from '@/constants/recipes-remote';
import { Colors, Radius, Shadow, Spacing, Type } from '@/constants/theme';
import { useCollections } from '@/lib/collections-store';
import { tapLight } from '@/lib/haptics';
import { recipeIcon as iconFor, RECIPE_ICON_BLEND } from '@/lib/recipe-icons';

type ResolvedRecipe = {
  id: string;
  title: string;
  swatch: string;
  time: string;
};

export default function CollectionScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const collectionId = typeof id === 'string' ? id : null;

  const collections = useCollections();
  const allRecipes = useAllRecipes();

  const collection = useMemo(
    () => collections.find((c) => c.id === collectionId) ?? null,
    [collections, collectionId],
  );

  // Resolve every recipeId in the collection to a renderable card.
  // Hero recipes use the PRODUCTS row (rich swatch / icon); the rest
  // get a minimal synthesized shape from the catalog so the grid
  // never has to special-case missing data.
  const recipes = useMemo<ResolvedRecipe[]>(() => {
    if (!collection) return [];
    const out: ResolvedRecipe[] = [];
    for (const recipeId of collection.recipeIds) {
      const product: Product | undefined = PRODUCTS.find(
        (p) => p.id === recipeId,
      );
      if (product) {
        out.push({
          id: product.id,
          title: product.title,
          swatch: product.swatch,
          time: product.time,
        });
        continue;
      }
      const remote = allRecipes.find((r) => r.id === recipeId);
      if (remote) {
        out.push({
          id: remote.id,
          title: remote.title,
          swatch: '#F1ECE0',
          time: remote.time,
        });
      }
    }
    return out;
  }, [collection, allRecipes]);

  // Bad route state (deep link, deleted collection, etc.) — bounce to
  // /saved instead of rendering an empty shell.
  useEffect(() => {
    if (collectionId && !collection) {
      const t = setTimeout(() => router.replace('/saved'), 100);
      return () => clearTimeout(t);
    }
  }, [collectionId, collection]);

  if (!collection) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <TopBar />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* No toolbar title — the on-page "COLLECTION" eyebrow + the
          large headline below act as the primary page title. A
          duplicated name in the toolbar would feel redundant. */}
      <TopBar />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>COLLECTION</Text>
        <Text style={styles.headline}>{collection.name}</Text>
        <Text style={styles.sub}>
          {recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'}
          {recipes.length === 0 ? ' yet' : ''}
        </Text>

        {recipes.length === 0 ? (
          <EmptyState
            onBrowse={() => {
              tapLight();
              router.push('/categories');
            }}
          />
        ) : (
          <View style={styles.grid}>
            {recipes.map((r) => (
              <Pressable
                key={r.id}
                onPress={() => {
                  tapLight();
                  router.push({ pathname: '/result', params: { id: r.id } });
                }}
                style={({ pressed }) => [
                  styles.card,
                  pressed && { transform: [{ scale: 0.98 }] },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Open ${r.title}`}
              >
                <View style={[styles.swatch, { backgroundColor: r.swatch }]}>
                  <Image
                    source={iconFor(r.id)}
                    testID="pc-recipe-icon"
                    style={[styles.icon, RECIPE_ICON_BLEND]}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.body}>
                  <Text style={styles.title} numberOfLines={1}>
                    {r.title}
                  </Text>
                  <Text style={styles.meta}>{r.time}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function EmptyState({ onBrowse }: { onBrowse: () => void }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyMark}>
        <Ionicons name="bookmark-outline" size={26} color={Colors.light.sageDeep} />
      </View>
      <Text style={styles.emptyTitle}>Empty collection</Text>
      <Text style={styles.emptyBody}>
        Open a recipe and tap the heart to add it here.
      </Text>
      <Pressable
        onPress={onBrowse}
        style={({ pressed }) => [styles.emptyCta, pressed && { opacity: 0.92 }]}
      >
        <Text style={styles.emptyCtaText}>Browse recipes</Text>
        <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  scroll: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl },

  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.6,
    color: Colors.light.sageDeep,
    marginTop: Spacing.md,
  },
  headline: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '700',
    color: Colors.light.text,
    letterSpacing: -0.4,
    marginTop: 6,
  },
  sub: {
    ...Type.caption,
    color: Colors.light.textMuted,
    marginTop: 6,
    marginBottom: Spacing.lg,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  card: {
    width: '48%',
    borderRadius: Radius.lg,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
    ...Shadow.card,
  },
  swatch: { height: 130, position: 'relative', overflow: 'hidden' },
  icon: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  body: { padding: Spacing.md, gap: 4 },
  title: { ...Type.bodyStrong, color: Colors.light.text },
  meta: { ...Type.caption, color: Colors.light.textMuted },

  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.lg,
  },
  emptyMark: {
    width: 56,
    height: 56,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: { ...Type.sectionTitle, color: Colors.light.text },
  emptyBody: {
    ...Type.body,
    color: Colors.light.textMuted,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 12,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.sageDeep,
  },
  emptyCtaText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
