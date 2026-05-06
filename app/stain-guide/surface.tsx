// Stain Guide — Step 2: where is the stain?
//
// Filters the surface options to those the chosen stain actually
// supports — surfacing the full 4-option grid would mislead the user
// into picking, say, "carpet" for an ink stain (we have no carpet
// guidance for ink). Hide the impossible options up front; the
// selection grid is the spec's accuracy guard.
//
// Bad route states (missing/unknown stain id) bounce back to step 1
// so the URL never ends up on a result page that can't render.

import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TopBar } from '@/components/top-bar';
import {
  findStainById,
  STAIN_SURFACE_META,
  surfacesForStain,
} from '@/constants/stain-solutions';
import { Colors, Shadow, Spacing, Type } from '@/constants/theme';
import { tapLight } from '@/lib/haptics';

export default function StainGuideStep2() {
  const { stain } = useLocalSearchParams<{ stain?: string }>();
  const stainId = typeof stain === 'string' ? stain : null;
  const solution = findStainById(stainId ?? undefined);
  const availableSurfaces = stainId ? surfacesForStain(stainId) : [];

  // If we landed here without a valid stain id (deep link, manual URL,
  // back-forward edge case), redirect to step 1 instead of rendering
  // a half-empty screen.
  useEffect(() => {
    if (!solution) router.replace('/stain-guide');
  }, [solution]);

  if (!solution) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TopBar title="Stain Guide" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>STEP 2 OF 3</Text>
        <Text style={styles.headline}>Where is it?</Text>
        <Text style={styles.sub}>
          {solution.emoji} {solution.name} — pick the surface for the
          right approach.
        </Text>

        <View style={styles.grid}>
          {availableSurfaces.map((s) => {
            const meta = STAIN_SURFACE_META[s];
            return (
              <Pressable
                key={s}
                onPress={() => {
                  tapLight();
                  router.push({
                    pathname: '/stain-guide/result',
                    params: { stain: solution.id, surface: s },
                  });
                }}
                style={({ pressed }) => [
                  styles.card,
                  pressed && { transform: [{ scale: 0.97 }] },
                ]}
                accessibilityRole="button"
                accessibilityLabel={meta.label}
              >
                <Text style={styles.cardEmoji}>{meta.emoji}</Text>
                <Text style={styles.cardName}>{meta.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
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
    marginBottom: 8,
  },
  headline: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '700',
    color: Colors.light.text,
    letterSpacing: -0.6,
  },
  sub: {
    ...Type.body,
    color: Colors.light.textMuted,
    marginTop: 8,
    marginBottom: Spacing.xl,
  },

  // 2-column grid — bigger cards than the stain picker because there
  // are at most 4 surfaces, often only 2-3 after filtering.
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  card: {
    width: '48%',
    aspectRatio: 1.2,
    backgroundColor: Colors.light.surface,
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadow.card,
  },
  cardEmoji: {
    fontSize: 38,
    marginBottom: 10,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
  },
});
