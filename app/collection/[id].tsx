import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AddRecipeToCollectionSheet from '@/components/add-recipe-to-collection-sheet';
import { Colors, Radius, Shadow, Spacing, Type } from '@/constants/theme';
import { PRODUCTS, type Product } from '@/constants/products';
import { useAllRecipes } from '@/constants/recipes-remote';
import { useCollections } from '@/lib/collections-store';
import { recipeIcon as iconFor, RECIPE_ICON_BLEND } from '@/lib/recipe-icons';

type Row = {
  id: string;
  title: string;
  swatch: string;
  group: string;
};

export default function CollectionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const collections = useCollections();
  const allRecipes = useAllRecipes();
  const [pickerOpen, setPickerOpen] = useState(false);

  const collection = useMemo(
    () => collections.find((c) => c.id === id),
    [collections, id],
  );

  // Resolve each recipeId to a row using the same fallback chain as
  // app/saved.tsx — hero PRODUCTS first, then remote recipes for AI/
  // user-generated entries. Drop unresolved IDs silently.
  const rows = useMemo<Row[]>(() => {
    if (!collection) return [];
    const out: Row[] = [];
    for (const recipeId of collection.recipeIds) {
      const product: Product | undefined = PRODUCTS.find(
        (p) => p.id === recipeId,
      );
      if (product) {
        out.push({
          id: product.id,
          title: product.title,
          swatch: product.swatch,
          group: product.group,
        });
        continue;
      }
      const remote = allRecipes.find((r) => r.id === recipeId);
      if (remote) {
        out.push({
          id: remote.id,
          title: remote.title,
          swatch: '#F1ECE0',
          group: remote.categoryKey ?? '',
        });
      }
    }
    return out;
  }, [collection, allRecipes]);

  if (!collection) {
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
          <Text style={styles.topTitle}>Collection</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Collection not found</Text>
          <Text style={styles.emptyBody}>
            It may have been deleted from another device.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.topTitle} numberOfLines={1}>
          {collection.name}
        </Text>
        {rows.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add recipe"
            onPress={() => setPickerOpen(true)}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
          >
            <Ionicons name="add" size={22} color={Colors.light.text} />
          </Pressable>
        ) : (
          <View style={{ width: 38 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.count}>
          {rows.length} {rows.length === 1 ? 'recipe' : 'recipes'}
        </Text>

        {rows.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyMark}>
              <Ionicons name="bookmark-outline" size={26} color={Colors.light.sageDeep} />
            </View>
            <Text style={styles.emptyTitle}>No recipes yet</Text>
            <Text style={styles.emptyBody}>
              Add recipes to keep things organized.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Search recipes to add"
              onPress={() => setPickerOpen(true)}
              style={({ pressed }) => [styles.emptySearch, pressed && { opacity: 0.85 }]}
            >
              <Ionicons name="search" size={16} color={Colors.light.textSubtle} />
              <Text style={styles.emptySearchText}>Search recipes…</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Browse recipes"
              onPress={() => router.push('/discover')}
              style={({ pressed }) => [styles.emptyCta, pressed && { opacity: 0.92 }]}
            >
              <Text style={styles.emptyCtaText}>Browse Recipes</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.list}>
            {rows.map((row) => (
              <Pressable
                key={row.id}
                onPress={() => router.push({ pathname: '/result', params: { id: row.id } })}
                style={({ pressed }) => [styles.row, pressed && { opacity: 0.92 }]}
              >
                <View style={[styles.swatch, { backgroundColor: row.swatch }]}>
                  <Image
                    source={iconFor(row.id)}
                    style={[styles.icon, RECIPE_ICON_BLEND]}
                    resizeMode="cover"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {row.title}
                  </Text>
                  {row.group ? (
                    <Text style={styles.rowMeta} numberOfLines={1}>
                      {row.group}
                    </Text>
                  ) : null}
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.light.textSubtle} />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      <AddRecipeToCollectionSheet
        visible={pickerOpen}
        collectionId={collection.id}
        existingRecipeIds={collection.recipeIds}
        onClose={() => setPickerOpen(false)}
      />
    </SafeAreaView>
  );
}

const ROW_IMAGE = 56;

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
  topTitle: { ...Type.bodyStrong, color: Colors.light.text, flex: 1, textAlign: 'center' },
  scroll: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxxl },
  count: {
    ...Type.caption,
    color: Colors.light.textMuted,
    marginBottom: Spacing.md,
  },
  list: { gap: Spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadow.card,
  },
  swatch: {
    width: ROW_IMAGE,
    height: ROW_IMAGE,
    borderRadius: Radius.md,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { width: '100%', height: '100%' },
  rowTitle: { ...Type.bodyStrong, color: Colors.light.text },
  rowMeta: { ...Type.caption, color: Colors.light.textMuted, marginTop: 2 },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  emptyMark: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  emptyTitle: { ...Type.sectionTitle, color: Colors.light.text },
  emptyBody: {
    ...Type.body,
    color: Colors.light.textMuted,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptySearch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    alignSelf: 'stretch',
    marginTop: Spacing.lg,
    marginHorizontal: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radius.pill,
  },
  emptySearchText: {
    ...Type.body,
    color: Colors.light.textSubtle,
  },
  emptyCta: {
    marginTop: Spacing.md,
    backgroundColor: Colors.light.sageDeep,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.pill,
  },
  emptyCtaText: { ...Type.bodyStrong, color: '#FFFFFF' },
});
