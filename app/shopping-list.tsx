import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { formatMoney, useCurrency } from '@/constants/currency';
import { findProduct, findRecipe } from '@/constants/products';
import { extractIngredientName } from '@/constants/smart-swaps';
import { tapLight } from '@/lib/haptics';
import { recipeIcon } from '@/lib/recipe-icons';
import { Colors, Radius, Shadow, Spacing, Type } from '@/constants/theme';

// Amazon affiliate tag — flip this on by setting EXPO_PUBLIC_AMAZON_TAG in
// .env once the Amazon Associates account is approved. Until then we ship
// the button without a tag (still works, just no commission).
const AMAZON_TAG = process.env.EXPO_PUBLIC_AMAZON_TAG;

export default function ShoppingList() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const product = findProduct(id);
  const recipe = findRecipe(id);
  const { currency } = useCurrency();

  const initialChecked = useMemo(
    () => Object.fromEntries(recipe.ingredients.map((i) => [i.name, false])) as Record<string, boolean>,
    [recipe.ingredients],
  );
  const [checked, setChecked] = useState<Record<string, boolean>>(initialChecked);

  const toBuy = recipe.ingredients.filter((i) => !i.haveIt);
  const haveIt = recipe.ingredients.filter((i) => i.haveIt);
  const totalUsd = toBuy.reduce((sum, i) => sum + (i.storePriceUsd ?? 0), 0);
  const checkedCount = toBuy.filter((i) => checked[i.name]).length;

  const toggle = (name: string) => {
    setChecked((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  // Build the Amazon search URL from the "to buy" list. We strip quantities
  // and units via extractIngredientName so the search reads as plain
  // ingredient names ("epsom salt+lavender oil") instead of "2+cups+epsom".
  // Keeping this memoized is cheap but avoids re-encoding on every press.
  const amazonUrl = useMemo(() => {
    const terms = toBuy
      .map((i) => extractIngredientName(i.name))
      .filter((s) => s.length > 0)
      .map((s) => encodeURIComponent(s))
      .join('+');
    if (!terms) return null;
    const tag = AMAZON_TAG ? `&tag=${encodeURIComponent(AMAZON_TAG)}` : '';
    return `https://www.amazon.com/s?k=${terms}${tag}`;
  }, [toBuy]);

  const onSearchAmazon = async () => {
    if (!amazonUrl) return;
    tapLight();
    try {
      await Linking.openURL(amazonUrl);
    } catch {
      // Browser/Amazon app missing — silently no-op rather than crash.
    }
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
          <Ionicons name="chevron-back" size={20} color={Colors.light.text} />
        </Pressable>
        <Text style={styles.topTitle}>Shopping list</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Share"
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
          onPress={() => {}}
        >
          <Ionicons name="share-outline" size={18} color={Colors.light.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.heroCard, { backgroundColor: product.swatch }]}>
          <Image
            source={recipeIcon(product.id)}
            testID="pc-recipe-icon"
            style={styles.heroIcon}
            resizeMode="contain"
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.heroEyebrow}>For</Text>
            <Text style={styles.heroTitle}>{recipe.title}</Text>
          </View>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{formatMoney(totalUsd, { currency })}</Text>
            <Text style={styles.heroStatLabel}>est. total</Text>
          </View>
        </View>

        <View style={styles.progressBlock}>
          <Text style={styles.progressLabel}>
            {checkedCount} of {toBuy.length} in cart
          </Text>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${toBuy.length > 0 ? (checkedCount / toBuy.length) * 100 : 0}%` },
              ]}
            />
          </View>
        </View>

        <SectionHeader title={`You'll need (${toBuy.length})`} caption="Pick these up" />
        <View style={styles.list}>
          {toBuy.map((ing, i) => {
            const isChecked = checked[ing.name];
            return (
              <Pressable
                key={ing.name}
                onPress={() => toggle(ing.name)}
                style={({ pressed }) => [
                  styles.row,
                  i === 0 && { borderTopWidth: 0 },
                  pressed && { backgroundColor: Colors.light.surfaceAlt },
                ]}
              >
                <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                  {isChecked ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, isChecked && styles.rowTitleChecked]}>{ing.name}</Text>
                  <Text style={styles.rowMeta}>{ing.amount}</Text>
                </View>
                <Text style={[styles.rowPrice, isChecked && styles.rowMeta]}>{ing.storePriceUsd != null ? formatMoney(ing.storePriceUsd, { currency }) : ''}</Text>
              </Pressable>
            );
          })}
        </View>

        {haveIt.length > 0 ? (
          <>
            <SectionHeader title={`In your pantry (${haveIt.length})`} caption="No need to buy" />
            <View style={[styles.list, styles.listMuted]}>
              {haveIt.map((ing, i) => (
                <View
                  key={ing.name}
                  style={[styles.row, i === 0 && { borderTopWidth: 0 }]}
                >
                  <View style={styles.haveDot}>
                    <Ionicons name="leaf" size={12} color={Colors.light.sageDeep} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{ing.name}</Text>
                    <Text style={styles.rowMeta}>{ing.amount}</Text>
                  </View>
                  <Text style={styles.haveTag}>Have it</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        <View style={styles.savingsCard}>
          <View style={styles.savingsIcon}>
            <Ionicons name="trending-down" size={18} color={Colors.light.sageDeep} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.savingsTitle}>You&apos;re saving {formatMoney(product.savingsUsd, { currency })}</Text>
            <Text style={styles.savingsSub}>
              Store-bought equivalent runs about {formatMoney(product.storeBoughtUsd, { currency })}.
            </Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="link"
          accessibilityLabel={
            amazonUrl
              ? 'Search all ingredients on Amazon'
              : 'Add items to search'
          }
          onPress={onSearchAmazon}
          disabled={!amazonUrl}
          style={({ pressed }) => [
            styles.amazonBtn,
            !amazonUrl && styles.amazonBtnDisabled,
            pressed && amazonUrl && { opacity: 0.92, transform: [{ scale: 0.99 }] },
          ]}
        >
          <View style={styles.amazonIcon}>
            <Ionicons
              name="search"
              size={16}
              color={amazonUrl ? Colors.light.text : Colors.light.textSubtle}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[styles.amazonText, !amazonUrl && { color: Colors.light.textSubtle }]}
            >
              {amazonUrl ? 'Search on Amazon' : 'Add items to search'}
            </Text>
            <Text style={styles.amazonSub}>
              {amazonUrl
                ? `Find all ${toBuy.length} ${toBuy.length === 1 ? 'item' : 'items'} in one tap`
                : 'No items currently need to be bought'}
            </Text>
          </View>
          {amazonUrl ? (
            <Ionicons
              name="open-outline"
              size={16}
              color={Colors.light.textMuted}
            />
          ) : null}
        </Pressable>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerActions}>
          <Pressable
            style={({ pressed }) => [styles.smallAction, pressed && { opacity: 0.7 }]}
            onPress={() => {}}
          >
            <Ionicons name="phone-portrait-outline" size={18} color={Colors.light.text} />
            <Text style={styles.smallActionText}>Send to phone</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <PrimaryButton
              label="Open in Instacart"
              trailingIcon="arrow-forward"
              onPress={() => {}}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function SectionHeader({ title, caption }: { title: string; caption?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {caption ? <Text style={styles.sectionCaption}>{caption}</Text> : null}
    </View>
  );
}

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
  topTitle: { ...Type.bodyStrong, color: Colors.light.text },
  scroll: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    ...Shadow.card,
  },
  heroEmoji: { fontSize: 38 },
  heroIcon: { width: 64, height: 64 },
  heroEyebrow: { ...Type.caption, color: Colors.light.sageDeep, textTransform: 'uppercase' },
  heroTitle: { ...Type.sectionTitle, color: Colors.light.text, marginTop: 2 },
  heroStat: { alignItems: 'flex-end' },
  heroStatValue: { ...Type.title, color: Colors.light.text },
  heroStatLabel: { ...Type.caption, color: Colors.light.textMuted },
  progressBlock: { marginTop: Spacing.lg, gap: Spacing.sm },
  progressLabel: { ...Type.caption, color: Colors.light.textMuted },
  progressTrack: {
    height: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.surfaceAlt,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: Colors.light.sageDeep, borderRadius: Radius.pill },
  sectionHeader: { marginTop: Spacing.xxl, marginBottom: Spacing.md },
  sectionTitle: { ...Type.sectionTitle, color: Colors.light.text },
  sectionCaption: { ...Type.caption, color: Colors.light.textMuted, marginTop: 2 },
  list: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
  },
  listMuted: { backgroundColor: Colors.light.cream, borderColor: Colors.light.creamDeep },
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
  checkboxChecked: { backgroundColor: Colors.light.sageDeep, borderColor: Colors.light.sageDeep },
  rowTitle: { ...Type.bodyStrong, color: Colors.light.text },
  rowTitleChecked: { color: Colors.light.textSubtle, textDecorationLine: 'line-through' },
  rowMeta: { ...Type.caption, color: Colors.light.textMuted, marginTop: 2 },
  rowPrice: { ...Type.bodyStrong, color: Colors.light.text },
  haveDot: {
    width: 24,
    height: 24,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  haveTag: {
    ...Type.caption,
    color: Colors.light.sageDeep,
    fontWeight: '600',
  },
  savingsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    backgroundColor: Colors.light.sageSoft,
    borderRadius: Radius.lg,
    marginTop: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.light.sage,
  },
  savingsIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savingsTitle: { ...Type.bodyStrong, color: Colors.light.text },
  savingsSub: { ...Type.caption, color: Colors.light.textMuted, marginTop: 2 },

  amazonBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    borderRadius: Radius.lg,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginTop: Spacing.md,
  },
  amazonBtnDisabled: {
    backgroundColor: Colors.light.cream,
    borderColor: Colors.light.creamDeep,
  },
  amazonIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.cream,
    borderWidth: 1,
    borderColor: Colors.light.creamDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amazonText: {
    ...Type.bodyStrong,
    color: Colors.light.text,
    letterSpacing: -0.1,
  },
  amazonSub: {
    ...Type.caption,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  footerActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  smallAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
  },
  smallActionText: { ...Type.caption, color: Colors.light.text },
});
