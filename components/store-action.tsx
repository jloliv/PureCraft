// Adaptive shopping button — replaces the hardcoded "Open in Instacart"
// CTA in the shopping-list footer.
//
// Behavior:
//   0 stores configured → label "Get ingredients"; tap opens the drop-up
//                         with "Choose a store" + "Print list".
//   1 store configured  → label "Add to cart at <Store>"; tap opens that
//                         store directly via Linking.openURL after a short
//                         "Preparing your cart…" loading state.
//   2+ stores configured→ label "Add to cart"; tap opens the drop-up
//                         with one "Add to cart at <Store>" row per
//                         configured store.
//
// "1-tap cart" illusion (Phase 1): a 650ms Modal overlay with a spinner
// and "Preparing your cart…" copy fires before the URL opens, so the
// transition feels intentional — like the cart is being assembled —
// rather than an abrupt redirect. We never claim the items were ACTUALLY
// added (no fake confirmations, no "Added!" toasts), because the store
// API integrations to do that for real are out of scope for this layer.
//
// The drop-up itself is a Modal sheet with the same visual language as
// the filter sheet in app/categories.tsx — backdrop tap to dismiss,
// rounded top corners, handle, slide animation.

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { Colors, Radius, Spacing, Type } from '@/constants/theme';
import { tapLight } from '@/lib/haptics';
import {
  openStore,
  printIngredients,
  type ShoppingIngredient,
} from '@/lib/store-actions';
import {
  storeOption,
  useStorePrefs,
  type StoreKey,
} from '@/lib/store-prefs';

type Props = {
  /** Items the user still needs to buy (already filtered to !haveIt). */
  ingredients: ShoppingIngredient[];
  /** Recipe title — used as the print sheet's heading. */
  recipeTitle: string;
};

// Length of the "Preparing your cart…" overlay before the URL opens.
// Long enough to feel like work is happening, short enough not to drag.
const PREPARING_MS = 650;

export function StoreAction({ ingredients, recipeTitle }: Props) {
  const stores = useStorePrefs();
  const [sheetOpen, setSheetOpen] = useState(false);
  // When non-null, the "Preparing your cart…" overlay is visible and a
  // store-open is pending. Used as the disabled gate so back-to-back
  // taps can't fire two openStore calls.
  const [pendingStore, setPendingStore] = useState<StoreKey | null>(null);
  const disabled = ingredients.length === 0;

  // Shared "tap → spinner → openStore" path used by both the 1-store
  // instant CTA and the drop-up store rows. Centralized so the illusion
  // is consistent and we don't have two timers running concurrently.
  const triggerStoreOpen = (key: StoreKey) => {
    if (pendingStore) return;
    tapLight();
    setSheetOpen(false);
    setPendingStore(key);
    setTimeout(() => {
      void openStore(key, ingredients);
      // Clear the overlay AFTER kicking the URL — by the time RN swaps
      // out of the app to the browser, this is academic. But if the
      // user backs out (no browser, deep link refused), the overlay
      // doesn't get stuck on screen.
      setPendingStore(null);
    }, PREPARING_MS);
  };

  // Resolve the button label / press behavior based on how many stores
  // the user has configured. Single source of branching so the footer
  // markup stays trivial.
  let label: string;
  let onPress: () => void;
  if (stores.length === 1) {
    label = `Add to cart at ${storeOption(stores[0]).label}`;
    onPress = () => triggerStoreOpen(stores[0]);
  } else if (stores.length > 1) {
    label = 'Add to cart';
    onPress = () => {
      tapLight();
      setSheetOpen(true);
    };
  } else {
    label = 'Get ingredients';
    onPress = () => {
      tapLight();
      setSheetOpen(true);
    };
  }

  const handlePrint = () => {
    setSheetOpen(false);
    tapLight();
    void printIngredients(ingredients, { recipeTitle });
  };

  const handleChooseStore = () => {
    setSheetOpen(false);
    router.push('/store-preferences');
  };

  return (
    <>
      <PrimaryButton
        label={label}
        trailingIcon={
          stores.length === 1
            ? 'arrow-forward'
            : stores.length > 1
              ? 'chevron-up'
              : undefined
        }
        onPress={onPress}
        disabled={disabled || pendingStore !== null}
      />

      {/* ============================== Drop-up ============================== */}
      <Modal
        visible={sheetOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSheetOpen(false)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setSheetOpen(false)}
          accessibilityRole="button"
          accessibilityLabel="Close store selector"
        />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>
            {stores.length > 1 ? 'Add to cart at…' : 'No store yet'}
          </Text>
          <Text style={styles.caption}>
            {stores.length > 1
              ? 'We’ll send the full list to your store of choice.'
              : 'Pick a store to shop at — or print the list and grab them in person.'}
          </Text>

          <View style={styles.actions}>
            {stores.length > 1
              ? stores.map((key) => {
                  const opt = storeOption(key);
                  return (
                    <Pressable
                      key={key}
                      onPress={() => triggerStoreOpen(key)}
                      style={({ pressed }) => [
                        styles.row,
                        pressed && { opacity: 0.85 },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Add to cart at ${opt.label}`}
                    >
                      <View style={styles.rowIcon}>
                        <Ionicons
                          name="cart-outline"
                          size={18}
                          color={Colors.light.sageDeep}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.rowLabel}>
                          Add to cart at {opt.label}
                        </Text>
                        <Text style={styles.rowSub}>{opt.tagline}</Text>
                      </View>
                      <Ionicons
                        name="open-outline"
                        size={16}
                        color={Colors.light.textMuted}
                      />
                    </Pressable>
                  );
                })
              : (
                  <>
                    <Pressable
                      onPress={handleChooseStore}
                      style={({ pressed }) => [
                        styles.row,
                        pressed && { opacity: 0.85 },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel="Choose a store"
                    >
                      <View style={styles.rowIcon}>
                        <Ionicons
                          name="storefront-outline"
                          size={18}
                          color={Colors.light.sageDeep}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.rowLabel}>Choose a store</Text>
                        <Text style={styles.rowSub}>
                          Set up your preferred stores
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={Colors.light.textMuted}
                      />
                    </Pressable>
                    <Pressable
                      onPress={handlePrint}
                      style={({ pressed }) => [
                        styles.row,
                        pressed && { opacity: 0.85 },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel="Print shopping list"
                    >
                      <View style={styles.rowIcon}>
                        <Ionicons
                          name="print-outline"
                          size={18}
                          color={Colors.light.sageDeep}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.rowLabel}>Print list</Text>
                        <Text style={styles.rowSub}>
                          {ingredients.length}{' '}
                          {ingredients.length === 1 ? 'item' : 'items'} on a
                          printable page
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={Colors.light.textMuted}
                      />
                    </Pressable>
                  </>
                )}
          </View>

          {stores.length > 1 ? (
            <Pressable
              onPress={handleChooseStore}
              style={({ pressed }) => [
                styles.manage,
                pressed && { opacity: 0.7 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Manage preferred stores"
            >
              <Text style={styles.manageText}>Manage stores</Text>
            </Pressable>
          ) : null}

          <Pressable
            onPress={() => setSheetOpen(false)}
            style={({ pressed }) => [
              styles.cancel,
              pressed && { opacity: 0.7 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </Modal>

      {/* ====================== "Preparing your cart…" ====================== */}
      <Modal
        visible={pendingStore !== null}
        transparent
        // Fade is calmer than slide for a 650ms overlay — keeps the
        // moment feeling like loading, not navigation.
        animationType="fade"
        onRequestClose={() => {
          /* noop — overlay self-dismisses on timer */
        }}
      >
        <View style={styles.preparingBackdrop}>
          <View style={styles.preparingCard}>
            <ActivityIndicator size="small" color={Colors.light.sageDeep} />
            <Text style={styles.preparingText}>Preparing your cart…</Text>
            {pendingStore ? (
              <Text style={styles.preparingSub}>
                Opening {storeOption(pendingStore).label}
              </Text>
            ) : null}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(31, 36, 33, 0.32)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.border,
    marginBottom: Spacing.lg,
  },
  title: {
    ...Type.sectionTitle,
    color: Colors.light.text,
    marginBottom: 4,
  },
  caption: {
    ...Type.caption,
    color: Colors.light.textMuted,
    marginBottom: Spacing.lg,
  },
  actions: {
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    ...Type.bodyStrong,
    color: Colors.light.text,
  },
  rowSub: {
    ...Type.caption,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  manage: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  manageText: {
    ...Type.caption,
    color: Colors.light.sageDeep,
    fontWeight: '600',
  },
  cancel: {
    marginTop: Spacing.lg,
    height: 50,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    ...Type.bodyStrong,
    color: Colors.light.text,
  },

  // ===== "Preparing your cart…" overlay ===================================
  preparingBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(31, 36, 33, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  preparingCard: {
    minWidth: 220,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
    borderRadius: Radius.lg,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#1F1F1F',
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  preparingText: {
    ...Type.bodyStrong,
    color: Colors.light.text,
    marginTop: 4,
  },
  preparingSub: {
    ...Type.caption,
    color: Colors.light.textMuted,
  },
});
