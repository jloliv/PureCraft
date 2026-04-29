// LockedRecipeCard — wraps any recipe card in a blur + lock overlay so free
// users can SEE there's more (curiosity!) but tapping opens the paywall
// instead of navigating to the recipe.
//
// Usage:
//   {recipes.map((r, i) => (
//     <LockedRecipeCard key={r.id} locked={isRecipeLocked(i)} recipeId={r.id}>
//       <YourCard ... />
//     </LockedRecipeCard>
//   ))}
//
// We require `expo-blur` for the visual; if it isn't installed at runtime
// we fall back to a translucent white overlay (still readable as "locked").

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useState } from 'react';

import { tapLight } from '@/lib/haptics';

import { FreemiumModal } from './freemium-modal';

const PALETTE = {
  text: '#111111',
  textWarm: '#6F6A60',
  surface: '#FFFFFF',
  border: '#E9E4DA',
  sageDeep: '#7E8F75',
  goldDeep: '#A98A4D',
};

export function LockedRecipeCard({
  locked,
  children,
  style,
}: {
  locked: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const [modalOpen, setModalOpen] = useState(false);

  if (!locked) return <>{children}</>;

  return (
    <>
      <FreemiumModal
        visible={modalOpen}
        kind="recipe-lock"
        onClose={() => setModalOpen(false)}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Premium recipe — tap to unlock"
        onPress={() => {
          tapLight();
          setModalOpen(true);
        }}
        style={[styles.wrap, style]}
      >
        {/* The original card renders behind the blur. */}
        <View pointerEvents="none">{children}</View>

        {/* Blur overlay covering the whole card. */}
        <BlurView
          intensity={28}
          tint="light"
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/* Soft gold-tinted veil to brand the lock state without screaming. */}
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: 'rgba(247,242,231,0.35)' },
          ]}
        />

        {/* Lock pill centered. */}
        <View pointerEvents="none" style={styles.lockCenter}>
          <View style={styles.lockPill}>
            <Ionicons name="lock-closed" size={13} color={PALETTE.goldDeep} />
            <Text style={styles.lockText}>PureCraft+</Text>
          </View>
        </View>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 20,
  },
  lockCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#1F1F1F',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  lockText: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.goldDeep,
    letterSpacing: 0.6,
  },
});
