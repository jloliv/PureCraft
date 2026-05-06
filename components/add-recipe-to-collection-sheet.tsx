// Bottom sheet for adding a recipe to a SPECIFIC collection.
//
// Different from save-to-collection-sheet.tsx which goes the other
// direction (one recipe → many collections). This sheet starts from a
// collection and pulls a recipe in. Used by app/collection/[id].tsx
// for the "+ Add" affordance and the empty-state search entry point.
//
// Sources:
//   - "Recent" rows come from useRecentRecipes() (last viewed by the user)
//   - "Popular" rows are the first N entries of the curated PRODUCTS list
//   - Search filters across PRODUCTS + remote allRecipes by title
// Recipes already in the collection are filtered out so the user can't
// add them twice.

import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
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

import { Colors, Radius, Shadow, Spacing, Type } from '@/constants/theme';
import { PRODUCTS, type Product } from '@/constants/products';
import { useAllRecipes } from '@/constants/recipes-remote';
import { addRecipeToCollection } from '@/lib/collections-store';
import { tapLight } from '@/lib/haptics';
import { recipeIcon as iconFor, RECIPE_ICON_BLEND } from '@/lib/recipe-icons';
import { useRecentRecipes } from '@/lib/recent-recipes';

type RecipeRow = {
  id: string;
  title: string;
  swatch: string;
};

const POPULAR_LIMIT = 6;

function productToRow(p: Product): RecipeRow {
  return { id: p.id, title: p.title, swatch: p.swatch };
}

export type AddRecipeToCollectionSheetProps = {
  visible: boolean;
  collectionId: string | null;
  /** IDs already in the collection — excluded from the picker. */
  existingRecipeIds: string[];
  onClose: () => void;
  onAdded?: (recipeId: string) => void;
};

export default function AddRecipeToCollectionSheet({
  visible,
  collectionId,
  existingRecipeIds,
  onClose,
  onAdded,
}: AddRecipeToCollectionSheetProps) {
  const [query, setQuery] = useState('');
  const recentIds = useRecentRecipes();
  const allRecipes = useAllRecipes();

  useEffect(() => {
    if (visible) setQuery('');
  }, [visible]);

  const existingSet = useMemo(
    () => new Set(existingRecipeIds),
    [existingRecipeIds],
  );

  // Combined catalog used for search and recent-id lookup. Hero PRODUCTS
  // win on title/swatch when a recipe exists in both.
  const catalog = useMemo<RecipeRow[]>(() => {
    const out: RecipeRow[] = [];
    const seen = new Set<string>();
    for (const p of PRODUCTS) {
      out.push(productToRow(p));
      seen.add(p.id);
    }
    for (const r of allRecipes) {
      if (seen.has(r.id)) continue;
      out.push({ id: r.id, title: r.title, swatch: '#F1ECE0' });
      seen.add(r.id);
    }
    return out;
  }, [allRecipes]);

  const recent = useMemo<RecipeRow[]>(() => {
    if (recentIds.length === 0) return [];
    const map = new Map(catalog.map((r) => [r.id, r]));
    return recentIds
      .map((id) => map.get(id))
      .filter((r): r is RecipeRow => Boolean(r))
      .filter((r) => !existingSet.has(r.id))
      .slice(0, 6);
  }, [recentIds, catalog, existingSet]);

  const popular = useMemo<RecipeRow[]>(() => {
    return PRODUCTS.filter((p) => !existingSet.has(p.id))
      .slice(0, POPULAR_LIMIT)
      .map(productToRow);
  }, [existingSet]);

  const searchResults = useMemo<RecipeRow[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return catalog
      .filter((r) => !existingSet.has(r.id))
      .filter((r) => r.title.toLowerCase().includes(q))
      .slice(0, 30);
  }, [query, catalog, existingSet]);

  const handleAdd = async (recipeId: string) => {
    if (!collectionId) return;
    tapLight();
    await addRecipeToCollection(collectionId, recipeId);
    onAdded?.(recipeId);
    onClose();
  };

  const renderRow = (row: RecipeRow) => (
    <Pressable
      key={row.id}
      accessibilityRole="button"
      accessibilityLabel={`Add ${row.title}`}
      onPress={() => handleAdd(row.id)}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}
    >
      <View style={[styles.swatch, { backgroundColor: row.swatch }]}>
        <Image
          source={iconFor(row.id)}
          style={[styles.icon, RECIPE_ICON_BLEND]}
          resizeMode="cover"
        />
      </View>
      <Text style={styles.rowTitle} numberOfLines={1}>
        {row.title}
      </Text>
      <Ionicons name="add-circle-outline" size={22} color={Colors.light.sageDeep} />
    </Pressable>
  );

  const showingSearch = query.trim().length > 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>Add to Collection</Text>

          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color={Colors.light.textSubtle} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search recipes…"
              placeholderTextColor={Colors.light.textSubtle}
              style={styles.searchInput}
              autoCorrect={false}
            />
            {query.length > 0 ? (
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
                <Ionicons
                  name="close-circle"
                  size={16}
                  color={Colors.light.textSubtle}
                />
              </Pressable>
            ) : null}
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
          >
            {showingSearch ? (
              searchResults.length > 0 ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Results</Text>
                  {searchResults.map(renderRow)}
                </View>
              ) : (
                <Text style={styles.empty}>No matches for “{query.trim()}”.</Text>
              )
            ) : (
              <>
                {recent.length > 0 ? (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recent</Text>
                    {recent.map(renderRow)}
                  </View>
                ) : null}
                {popular.length > 0 ? (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Popular</Text>
                    {popular.map(renderRow)}
                  </View>
                ) : null}
                {recent.length === 0 && popular.length === 0 ? (
                  <Text style={styles.empty}>
                    Every recipe is already in this collection.
                  </Text>
                ) : null}
              </>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const ROW_IMAGE = 44;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
    maxHeight: '80%',
    ...Shadow.raised,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.border,
    marginBottom: Spacing.md,
  },
  title: {
    ...Type.sectionTitle,
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  searchInput: {
    flex: 1,
    ...Type.body,
    color: Colors.light.text,
    paddingVertical: 4,
  },
  scroll: { paddingTop: Spacing.lg, paddingBottom: Spacing.lg },
  section: { marginBottom: Spacing.lg },
  sectionTitle: {
    ...Type.micro,
    color: Colors.light.textMuted,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  swatch: {
    width: ROW_IMAGE,
    height: ROW_IMAGE,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  icon: { width: '100%', height: '100%' },
  rowTitle: { ...Type.bodyStrong, color: Colors.light.text, flex: 1 },
  empty: {
    ...Type.body,
    color: Colors.light.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },
});
