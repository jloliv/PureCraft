// Stain Guide — Step 3: result.
//
// Shows the SINGLE matched solution per spec ("returns 1 best match,
// not a list"). No alternative recipes, no related-stains fallback,
// no comparison table. The whole point of the guided flow is that
// once the user has picked stain + surface, the answer is decisive.
//
// Layout follows the spec exactly:
//   Top:        Stain name (Surface)  +  category tag
//   Avoid:      ⚠ list of don'ts
//   Steps:      ✅ ordered, action-oriented
//   CTA:        "Use Full Recipe →" linking to the catalog recipe
//
// Recipe CTA: every entry in the dataset is mapped to a real recipe
// id at data-write time (see constants/stain-solutions.ts) so the
// link never dead-ends. If the linked recipe is somehow missing at
// runtime (e.g. catalog drift), we fall back to a generic search
// rather than rendering a broken button.

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  findStainById,
  resolveStainResult,
  STAIN_CATEGORY_META,
  STAIN_SURFACE_META,
  type StainSurface,
} from '@/constants/stain-solutions';
import { findRecipeById } from '@/constants/recipes';
import { Colors, Radius, Shadow, Spacing, Type } from '@/constants/theme';
import { tapLight } from '@/lib/haptics';

const VALID_SURFACES: StainSurface[] = [
  'fabric',
  'carpet',
  'upholstery',
  'hard-surface',
];

export default function StainGuideStep3() {
  const { stain, surface } = useLocalSearchParams<{
    stain?: string;
    surface?: string;
  }>();
  const stainId = typeof stain === 'string' ? stain : null;
  const surfaceId =
    typeof surface === 'string' && (VALID_SURFACES as string[]).includes(surface)
      ? (surface as StainSurface)
      : null;

  const solution =
    stainId && surfaceId ? resolveStainResult(stainId, surfaceId) : null;

  // Bad route state — bounce to step 1 instead of an empty screen.
  useEffect(() => {
    if (!solution) router.replace('/stain-guide');
  }, [solution]);

  if (!solution || !surfaceId) return null;

  const surfaceMeta = STAIN_SURFACE_META[surfaceId];
  const categoryMeta = STAIN_CATEGORY_META[solution.category];
  const linkedRecipe = findRecipeById(solution.recipeId);

  const onUseRecipe = () => {
    tapLight();
    if (linkedRecipe) {
      router.push({ pathname: '/result', params: { id: linkedRecipe.id } });
      return;
    }
    // Fallback when catalog drift removes the linked recipe — at
    // least surface a search by category so the user gets something.
    router.push({ pathname: '/search', params: { q: solution.name } });
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
        <Text style={styles.topTitle}>Stain Guide</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Start over"
          onPress={() => router.replace('/stain-guide')}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="refresh" size={18} color={Colors.light.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ============================ Result header ====================== */}
        <View style={styles.headerCard}>
          <Text style={styles.emoji}>{solution.emoji}</Text>
          <Text style={styles.title}>
            {solution.name}{' '}
            <Text style={styles.titleSurface}>({surfaceMeta.label})</Text>
          </Text>
          <View style={styles.tagRow}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{categoryMeta.label}</Text>
            </View>
            {solution.urgency === 'immediate' ? (
              <View style={[styles.tag, styles.tagUrgent]}>
                <Ionicons name="alarm-outline" size={12} color="#FFFFFF" />
                <Text style={[styles.tagText, styles.tagTextUrgent]}>
                  Act fast
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* ============================ Avoid block ======================== */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Ionicons
              name="warning-outline"
              size={16}
              color={Colors.light.danger}
            />
            <Text style={[styles.sectionTitle, { color: Colors.light.danger }]}>
              Avoid
            </Text>
          </View>
          {solution.avoid.map((line, i) => (
            <View key={i} style={styles.bullet}>
              <View style={styles.bulletDot} />
              <Text style={styles.bulletText}>{line}</Text>
            </View>
          ))}
        </View>

        {/* ============================ Steps block ======================== */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Ionicons
              name="checkmark-circle-outline"
              size={16}
              color={Colors.light.sageDeep}
            />
            <Text style={[styles.sectionTitle, { color: Colors.light.sageDeep }]}>
              Steps
            </Text>
          </View>
          {solution.steps.map((step, i) => (
            <View key={i} style={styles.step}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ============================ Recipe CTA =========================== */}
      <View style={styles.footer}>
        <Pressable
          onPress={onUseRecipe}
          style={({ pressed }) => [
            styles.cta,
            pressed && { opacity: 0.92 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={
            linkedRecipe
              ? `Use full recipe — ${linkedRecipe.title}`
              : 'See related recipes'
          }
        >
          <Text style={styles.ctaText}>
            {linkedRecipe ? 'Use Full Recipe' : 'See related recipes'}
          </Text>
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
        </Pressable>
      </View>
    </SafeAreaView>
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

  // Header card with emoji + name + tags. Visual anchor for the page.
  headerCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    ...Shadow.card,
  },
  emoji: { fontSize: 48, marginBottom: 8 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  titleSurface: { color: Colors.light.textMuted, fontWeight: '500' },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.sageSoft,
  },
  tagText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: Colors.light.sageDeep,
    letterSpacing: 0.3,
  },
  tagUrgent: { backgroundColor: Colors.light.danger },
  tagTextUrgent: { color: '#FFFFFF' },

  section: { marginTop: Spacing.xl },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },

  bullet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 6,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: Colors.light.danger,
    marginTop: 8,
  },
  bulletText: {
    flex: 1,
    ...Type.body,
    color: Colors.light.text,
  },

  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 8,
  },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: Colors.light.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.sageDeep,
  },
  stepText: {
    flex: 1,
    ...Type.body,
    color: Colors.light.text,
    paddingTop: 2,
  },

  footer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  cta: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.sageDeep,
    shadowColor: Colors.light.sageDeep,
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
