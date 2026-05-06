// Stain Guide — Step 1: pick the stain type.
//
// First of three separate screens per spec ("Keep each step as a
// separate screen with minimal UI. Do not combine steps into one
// page."). The whole flow is structured-first: this picker yields a
// stainId, step 2 (/stain-guide/surface) yields a surface, step 3
// (/stain-guide/result) renders the matched solution.
//
// We intentionally keep the grid SMALL — 9 entries from the v1
// dataset. The spec is explicit: "Don't add too many stain options."
// More entries dilute the "I see my stain" hit rate.

import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TopBar } from '@/components/top-bar';
import { STAIN_SOLUTIONS } from '@/constants/stain-solutions';
import { Colors, Shadow, Spacing, Type } from '@/constants/theme';
import { tapLight } from '@/lib/haptics';

export default function StainGuideStep1() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TopBar title="Stain Guide" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>STEP 1 OF 3</Text>
        <Text style={styles.headline}>What stain are you dealing with?</Text>
        <Text style={styles.sub}>
          Pick the closest match. We&apos;ll guide you through the rest.
        </Text>

        <View style={styles.grid}>
          {STAIN_SOLUTIONS.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => {
                tapLight();
                router.push({
                  pathname: '/stain-guide/surface',
                  params: { stain: s.id },
                });
              }}
              style={({ pressed }) => [
                styles.card,
                pressed && { transform: [{ scale: 0.97 }] },
              ]}
              accessibilityRole="button"
              accessibilityLabel={s.name}
            >
              <Text style={styles.cardEmoji}>{s.emoji}</Text>
              <Text style={styles.cardName} numberOfLines={2}>
                {s.name.replace(' Stain', '')}
              </Text>
            </Pressable>
          ))}
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

  // 3-column grid — see preferences.tsx pantryGrid for the why on
  // `justifyContent: space-between` (vs. `gap`). Short version:
  // gap + 31.5% overflows on phone widths and causes the third
  // card to wrap to a new row, producing a 2-column layout.
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '31.5%',
    aspectRatio: 1,
    marginBottom: 12,
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadow.card,
  },
  cardEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  cardName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
  },
});
