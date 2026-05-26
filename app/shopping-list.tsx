// Persistent multi-recipe shopping list. Replaces the previous per-
// recipe view that took an `id` route param and rendered one recipe's
// ingredients alongside store-cart integrations and price totals.
//
// New shape (per spec):
//   - Items grouped under "For: <recipe>" section eyebrows.
//   - Checkbox interaction tracks per-item state in lib/shopping-list-
//     store.ts (AsyncStorage-backed).
//   - Native Share button outputs the spec's clean text format —
//     no URLs, no pricing, no store CTAs.
//   - Empty state nudges back to recipe browsing.
//
// What's intentionally NOT here: pricing, savings cards, "Search on
// Amazon", store-cart drop-ups.

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { TopBar } from '@/components/top-bar';
import { tapLight } from '@/lib/haptics';
import {
  clearCheckedItems,
  formatShareText,
  removeRecipeFromList,
  toggleListItem,
  useShoppingList,
  type ShoppingItem,
} from '@/lib/shopping-list-store';
import { Colors, Radius, Spacing, Type } from '@/constants/theme';

export default function ShoppingList() {
  const list = useShoppingList();

  // Group items by recipeId so the UI can render a "For: <title>"
  // header above each block. Stable order = recipe-add order; within
  // a recipe, item insertion order is preserved.
  const grouped = useMemo(() => {
    return list.recipes
      .map((r) => ({
        recipe: r,
        items: list.items.filter((i) => i.recipeId === r.id),
      }))
      .filter((g) => g.items.length > 0);
  }, [list.recipes, list.items]);

  const totalItems = list.items.length;
  const checkedItems = list.items.filter((i) => i.checked).length;
  const hasAnyChecked = checkedItems > 0;

  const handleShare = async () => {
    const text = formatShareText(list);
    if (!text) return;
    tapLight();
    try {
      await Share.share({ message: text });
    } catch {
      // User cancelled or no share target. The library already
      // distinguishes dismissedAction from real errors, so this is a
      // best-effort silent no-op for cancels.
    }
  };

  const handleClearChecked = async () => {
    tapLight();
    await clearCheckedItems();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* No trailing — sharing lives in the footer. The TopBar
          component intentionally renders nothing on the right when
          no trailing prop is passed, instead of a placeholder bubble. */}
      <TopBar title="Shopping list" />

      {totalItems === 0 ? (
        <EmptyState onBrowse={() => router.replace('/categories')} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>
              {totalItems} {totalItems === 1 ? 'item' : 'items'}
              {checkedItems > 0 ? `  ·  ${checkedItems} checked` : ''}
            </Text>
            {hasAnyChecked ? (
              <Pressable hitSlop={8} onPress={handleClearChecked}>
                <Text style={styles.summaryAction}>Clear checked</Text>
              </Pressable>
            ) : null}
          </View>

          {grouped.map(({ recipe, items }) => (
            <RecipeBlock
              key={recipe.id}
              title={recipe.title}
              items={items}
              onRemoveAll={() => {
                tapLight();
                void removeRecipeFromList(recipe.id);
              }}
            />
          ))}

          {/* Reassurance copy — explicit "no checkout, no store",
              keeps the spec's promise visible and pre-empts the
              "where's the buy button?" question. */}
          <View style={styles.note}>
            <Ionicons
              name="information-circle-outline"
              size={14}
              color={Colors.light.textMuted}
            />
            <Text style={styles.noteText}>
              Take this list to the store you already use — Share it to yourself
              or anyone helping you shop.
            </Text>
          </View>

          <View style={{ height: Spacing.xxxl }} />
        </ScrollView>
      )}

      {/* Bottom action bar — single primary CTA. The footer is the
          natural "next step" position for sharing because it sits
          AFTER the user has reviewed the list. Hidden when the list
          is empty (the empty-state component already owns that
          screen's CTA). */}
      {totalItems > 0 ? (
        <View style={styles.footer}>
          <PrimaryButton
            label="Send list"
            leadingIcon="paper-plane-outline"
            onPress={handleShare}
          />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

// =============================================================================
// Per-recipe block
// =============================================================================

function RecipeBlock({
  title,
  items,
  onRemoveAll,
}: {
  title: string;
  items: ShoppingItem[];
  onRemoveAll: () => void;
}) {
  return (
    <View style={styles.block}>
      <View style={styles.blockHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>FOR</Text>
          <Text style={styles.blockTitle} numberOfLines={1}>
            {title}
          </Text>
        </View>
        <Pressable
          hitSlop={8}
          onPress={onRemoveAll}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${title} from list`}
        >
          <Text style={styles.removeText}>Remove</Text>
        </Pressable>
      </View>

      <View style={styles.list}>
        {items.map((it, i) => (
          <Row key={it.key} item={it} isFirst={i === 0} />
        ))}
      </View>
    </View>
  );
}

function Row({ item, isFirst }: { item: ShoppingItem; isFirst: boolean }) {
  return (
    <Pressable
      onPress={() => {
        tapLight();
        void toggleListItem(item.key);
      }}
      style={({ pressed }) => [
        styles.row,
        isFirst && { borderTopWidth: 0 },
        pressed && { backgroundColor: Colors.light.surfaceAlt },
      ]}
    >
      <View
        style={[styles.checkbox, item.checked && styles.checkboxChecked]}
      >
        {item.checked ? (
          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
        ) : null}
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={[styles.rowTitle, item.checked && styles.rowTitleChecked]}
          numberOfLines={2}
        >
          {item.name}
        </Text>
        {item.amount ? (
          <Text style={[styles.rowMeta, item.checked && styles.rowMetaChecked]}>
            {item.amount}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

// =============================================================================
// Empty state
// =============================================================================

function EmptyState({ onBrowse }: { onBrowse: () => void }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyMark}>
        <Ionicons name="cart-outline" size={26} color={Colors.light.sageDeep} />
      </View>
      <Text style={styles.emptyTitle}>Your shopping list is empty</Text>
      <Text style={styles.emptyBody}>
        Tap “Add to Shopping List” on any recipe and the ingredients you
        don&apos;t already have will land here.
      </Text>
      <Pressable
        onPress={onBrowse}
        style={({ pressed }) => [
          styles.emptyCta,
          pressed && { opacity: 0.92 },
        ]}
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

  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  summaryTitle: {
    ...Type.caption,
    color: Colors.light.textMuted,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  summaryAction: {
    ...Type.caption,
    color: Colors.light.sageDeep,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  block: {
    marginBottom: Spacing.xl,
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: Spacing.md,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.6,
    color: Colors.light.sageDeep,
  },
  blockTitle: {
    ...Type.sectionTitle,
    color: Colors.light.text,
    marginTop: 2,
  },
  removeText: {
    ...Type.caption,
    color: Colors.light.textMuted,
    fontWeight: '600',
    paddingBottom: 2,
  },

  list: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.light.sageDeep,
    borderColor: Colors.light.sageDeep,
  },
  rowTitle: { ...Type.bodyStrong, color: Colors.light.text },
  rowTitleChecked: {
    color: Colors.light.textSubtle,
    textDecorationLine: 'line-through',
  },
  rowMeta: {
    ...Type.caption,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  rowMetaChecked: { color: Colors.light.textSubtle },

  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: Spacing.lg,
    paddingHorizontal: 4,
  },
  noteText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 17,
    color: Colors.light.textMuted,
  },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
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
    paddingHorizontal: Spacing.lg,
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.xl,
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

  // Bottom action bar — sits below the scroll content, above any
  // home-indicator inset. Single primary CTA per the spec's
  // "one primary, one secondary" hierarchy (the secondary "Clear
  // checked" lives inline in the summary row so it's contextual to
  // the data, not duplicated in the footer).
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
});
