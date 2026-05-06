// Store-preferences screen — where the user picks up to 3 stores that
// the shopping-list footer should treat as "their" places to shop. The
// adaptive button reads from these prefs to decide instant-action vs
// drop-up vs print fallback.
//
// Reachable from:
//   - The drop-up "Choose a store" entry on the shopping-list screen
//     (when the user has 0 stores configured).
//   - The drop-up "Manage stores" entry (when 2+ are configured).
//
// We don't gate this on auth — it's a local device preference, lives in
// AsyncStorage. See lib/store-prefs.ts for the storage layer.

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { TopBar } from '@/components/top-bar';
import { Colors, Radius, Shadow, Spacing, Type } from '@/constants/theme';
import { tapLight } from '@/lib/haptics';
import {
  PREFERRED_STORES_LIMIT,
  STORE_OPTIONS,
  togglePreferredStore,
  useStorePrefs,
  type StoreKey,
} from '@/lib/store-prefs';

export default function StorePreferences() {
  const stores = useStorePrefs();
  const remaining = PREFERRED_STORES_LIMIT - stores.length;

  const handleToggle = (key: StoreKey) => {
    tapLight();
    void togglePreferredStore(key);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TopBar title="Where you shop" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>
          Pick up to {PREFERRED_STORES_LIMIT}. We’ll send your shopping list
          straight to one of these every time you tap the cart on a recipe.
        </Text>
        <Text style={styles.helper}>
          {stores.length === 0
            ? 'No stores selected yet.'
            : remaining > 0
              ? `${stores.length} selected · ${remaining} more available`
              : `${stores.length} selected · at the limit`}
        </Text>

        <View style={styles.list}>
          {STORE_OPTIONS.map((opt) => {
            const selected = stores.includes(opt.key);
            // Disable adding when at the cap, but always allow removing.
            const disabled = !selected && remaining <= 0;
            return (
              <Pressable
                key={opt.key}
                onPress={() => handleToggle(opt.key)}
                disabled={disabled}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected, disabled }}
                accessibilityLabel={`${opt.label} — ${
                  selected ? 'remove' : 'add'
                }`}
                style={({ pressed }) => [
                  styles.card,
                  selected && styles.cardActive,
                  disabled && styles.cardDisabled,
                  pressed && !disabled && { opacity: 0.85 },
                ]}
              >
                <View
                  style={[
                    styles.bullet,
                    selected && styles.bulletActive,
                  ]}
                >
                  {selected ? (
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  ) : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardLabel}>{opt.label}</Text>
                  <Text style={styles.cardSub}>{opt.tagline}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label="Done"
          trailingIcon="checkmark"
          onPress={() => router.back()}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  scroll: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl },
  intro: {
    ...Type.body,
    color: Colors.light.text,
    marginBottom: Spacing.sm,
  },
  helper: {
    ...Type.caption,
    color: Colors.light.textMuted,
    marginBottom: Spacing.lg,
  },

  list: {
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    borderRadius: Radius.lg,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadow.card,
  },
  cardActive: {
    borderColor: Colors.light.sageDeep,
    backgroundColor: Colors.light.sageSoft,
  },
  cardDisabled: {
    opacity: 0.45,
  },
  bullet: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulletActive: {
    backgroundColor: Colors.light.sageDeep,
    borderColor: Colors.light.sageDeep,
  },
  cardLabel: {
    ...Type.bodyStrong,
    color: Colors.light.text,
  },
  cardSub: {
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
});
