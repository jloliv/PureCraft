import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IngredientHelpSheet } from '@/components/ingredient-help-sheet';
import { PrimaryButton } from '@/components/primary-button';
import { formatMoney, useCurrency } from '@/constants/currency';
import { hasIngredientHelp } from '@/constants/ingredient-help';
import { findProduct, findRecipe } from '@/constants/products';
import { autoBullets, benefitsFor } from '@/constants/recipe-benefits';
import { findRecipeById } from '@/constants/recipes-remote';
import { shelfLifeFor } from '@/constants/recipe-shelf-life';
import { computeSavings, formatRange } from '@/constants/savings';
import { FreemiumModal, type FreemiumKind } from '@/components/freemium-modal';
import { events } from '@/lib/analytics';
import { useAuth } from '@/lib/auth';
import {
  avoidIfFromIngredients,
  bestForFromIngredients,
  safetyNotesFromIngredients,
} from '@/constants/ingredient-intel';
import { extractIngredientName, getSmartSwaps, type SmartSwap } from '@/constants/smart-swaps';
import { tapLight, tapSoft } from '@/lib/haptics';
import { computeMatch, MATCH_COPY } from '@/lib/pantry-match';
import { usePantry } from '@/lib/pantry-store';
import { recordRecipeView } from '@/lib/recent-recipes';
import { recipeIcon } from '@/lib/recipe-icons';
import { scaleAmount } from '@/lib/scale-amount';
import { toggleSaved, useSavedRecipes } from '@/lib/saved-recipes';
import { Colors, Radius, Shadow, Spacing, Type } from '@/constants/theme';

const BATCH_OPTIONS = [1, 2, 3, 5] as const;
type BatchSize = (typeof BATCH_OPTIONS)[number];

export default function Result() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const product = findProduct(id);
  const recipe = findRecipe(id);
  const { currency } = useCurrency();
  const { user } = useAuth();
  const { saved: savedMap } = useSavedRecipes();
  const saved = savedMap.has(product.id);
  const [helpFor, setHelpFor] = useState<string | null>(null);
  const [batch, setBatch] = useState<BatchSize>(1);

  // Fire `recipe_viewed` once per mount per recipe so funnel/retention data
  // is meaningful (not a hot-reload spam). Also push onto the recent list.
  useEffect(() => {
    if (product.id) {
      events.recipeViewed(product.id);
      void recordRecipeView(product.id);
    }
  }, [product.id]);

  // Reset the batch multiplier back to 1× whenever the user navigates to a
  // different recipe (Expo Router reuses this component when only the id
  // param changes, so component-local state would otherwise leak across).
  useEffect(() => {
    setBatch(1);
  }, [product.id]);

  const [gateModal, setGateModal] = useState<FreemiumKind | null>(null);

  const onToggleSave = () => {
    tapLight();
    if (!user) {
      // Not signed in — punt to sign-in. (TODO: AsyncStorage saves for guests.)
      router.push('/auth/sign-in');
      return;
    }
    void (async () => {
      const { gated } = await toggleSaved(product.id);
      if (gated) setGateModal('save');
    })();
  };
  const savings = computeSavings(product.id);
  const retailLabel = `${formatRange(savings.retailLowUsd, savings.retailHighUsd, { currency })} at the store`;
  const savingsValue = savings.isEstimate
    ? formatRange(savings.savingsLowUsd, savings.savingsHighUsd, { currency, round: true })
    : formatMoney(savings.savingsMidUsd, { currency });

  const v3Recipe = findRecipeById(product.id);
  const benefits = benefitsFor(product.id, v3Recipe?.categoryKey);
  const shelf = shelfLifeFor(product.id, v3Recipe?.categoryKey);
  const extraBullets = autoBullets({
    // Only inject the savings bullet when (a) the override copy doesn't
    // already mention savings and (b) the recipe genuinely saves enough.
    savingsLabel:
      savings.savingsMidUsd >= 5 &&
      !benefits.benefits.some((b) => /save|saves/i.test(b))
        ? formatMoney(savings.savingsMidUsd, { currency, round: true })
        : null,
    safeForKids:
      v3Recipe?.safeForKids &&
      !benefits.benefits.some((b) => /family|baby|kid/i.test(b)),
    categoryKey: v3Recipe?.categoryKey,
  });
  const allBullets = [...benefits.benefits, ...extraBullets].slice(0, 6);

  // Flatten the recipe's ingredients to "amount name" strings so the intel
  // helpers (which operate on free-text) work uniformly across hero +
  // v3-bridge recipes. Hero recipes have name+amount split; v3 recipes
  // already have the full string in `name` (and empty `amount`).
  const flatIngredients = recipe.ingredients.map((i) =>
    i.amount ? `${i.amount} ${i.name}` : i.name,
  );

  const pantry = usePantry();
  const match = useMemo(
    () => computeMatch(flatIngredients, pantry),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [flatIngredients.join('|'), pantry],
  );

  // Derive Best For / Avoid If / extra Safety Tips from ingredient intel.
  const intelBestFor = useMemo(
    () => bestForFromIngredients(flatIngredients),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [flatIngredients.join('|')],
  );
  const intelAvoidIf = useMemo(
    () => avoidIfFromIngredients(flatIngredients),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [flatIngredients.join('|')],
  );
  const intelSafety = useMemo(
    () => safetyNotesFromIngredients(flatIngredients),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [flatIngredients.join('|')],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FreemiumModal
        visible={gateModal !== null}
        kind={gateModal ?? 'save'}
        onClose={() => setGateModal(null)}
      />
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.replace('/home')}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="close" size={20} color={Colors.light.text} />
        </Pressable>
        <View style={styles.topActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Share"
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
            onPress={async () => {
              tapLight();
              try {
                await Share.share({
                  // Native share sheet handles email/Messages/Twitter/etc.
                  // Deep link uses the app's purecraft:// scheme; ensure
                  // app.json sets `scheme: "purecraft"` for native handling,
                  // and a public web preview at /r/<id> for browsers.
                  message: `${recipe.title} — a PureCraft DIY recipe.\nhttps://purecraft.app/r/${product.id}`,
                  url: `https://purecraft.app/r/${product.id}`,
                  title: recipe.title,
                });
              } catch {
                // User cancelled or share unavailable — silently no-op.
              }
            }}
          >
            <Ionicons name="share-outline" size={18} color={Colors.light.text} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={saved ? 'Saved' : 'Save'}
            style={({ pressed }) => [
              styles.iconBtn,
              saved && styles.iconBtnActive,
              pressed && { opacity: 0.6 },
            ]}
            onPress={onToggleSave}
          >
            <Ionicons
              name={saved ? 'heart' : 'heart-outline'}
              size={18}
              color={saved ? '#FFFFFF' : Colors.light.text}
            />
          </Pressable>
        </View>
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
          <Text style={styles.heroTitle}>{recipe.title}</Text>
          <Text style={styles.heroBlurb}>{recipe.blurb}</Text>
          <View style={styles.heroTags}>
            {product.tags.map((t) => (
              <View key={t} style={styles.heroTag}>
                <Text style={styles.heroTagText}>{t}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.statsRow}>
          <Stat label="Time" value={product.time} icon="time-outline" />
          <Stat label="Ingredients" value={`${recipe.ingredients.length}`} icon="leaf-outline" />
          <Stat label="You save" value={savingsValue} icon="cash-outline" highlight />
        </View>

        {savings.bottlesAvoided > 0 ? (
          <View style={styles.impactRow}>
            <Ionicons name="leaf-outline" size={14} color={Colors.light.sageDeep} />
            <Text style={styles.impactText}>
              {savings.bottlesAvoided === 1
                ? '1 plastic bottle avoided'
                : `${savings.bottlesAvoided} plastic bottles avoided`}
              {' · '}
              <Text style={styles.impactSubtle}>vs {savings.retailLabel}</Text>
            </Text>
          </View>
        ) : null}

        <View style={styles.benefitsCard}>
          <View style={styles.benefitsHeader}>
            <Ionicons name="sparkles" size={14} color={Colors.light.sageDeep} />
            <Text style={styles.benefitsEyebrow}>Benefits</Text>
          </View>
          <View style={styles.benefitsList}>
            {allBullets.map((b) => (
              <View key={b} style={styles.benefitRow}>
                <View style={styles.benefitDot} />
                <Text style={styles.benefitText}>{b}</Text>
              </View>
            ))}
          </View>

          {benefits.bestFor?.length || benefits.useFrequency ? (
            <View style={styles.benefitsDivider} />
          ) : null}

          {benefits.bestFor?.length ? (
            <View style={styles.benefitsMetaBlock}>
              <Text style={styles.benefitsMetaLabel}>BEST FOR</Text>
              <View style={styles.bestForRow}>
                {benefits.bestFor.map((tag) => (
                  <View key={tag} style={styles.bestForChip}>
                    <Text style={styles.bestForText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {benefits.useFrequency ? (
            <View style={styles.benefitsMetaBlock}>
              <Text style={styles.benefitsMetaLabel}>USE FREQUENCY</Text>
              <Text style={styles.benefitsMetaValue}>{benefits.useFrequency}</Text>
            </View>
          ) : null}

          {benefits.whyItWorks ? (
            <>
              <View style={styles.benefitsDivider} />
              <View style={styles.benefitsMetaBlock}>
                <Text style={styles.benefitsMetaLabel}>WHY IT WORKS</Text>
                <Text style={styles.whyItWorksText}>{benefits.whyItWorks}</Text>
              </View>
            </>
          ) : null}
        </View>

        <View style={styles.shelfCard}>
          <View style={styles.shelfHeader}>
            <Ionicons name="time-outline" size={14} color={Colors.light.sageDeep} />
            <Text style={styles.shelfEyebrow}>Shelf life</Text>
          </View>
          <Text style={styles.shelfDuration}>{shelf.duration}</Text>

          {shelf.badges.length ? (
            <View style={styles.shelfBadgeRow}>
              {shelf.badges.map((badge) => (
                <View key={badge} style={styles.shelfBadge}>
                  <Text style={styles.shelfBadgeText}>{badge}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.shelfMetaRow}>
            <View style={styles.shelfMetaCol}>
              <Text style={styles.shelfMetaLabel}>STORE IN</Text>
              <Text style={styles.shelfMetaValue}>{shelf.storage}</Text>
            </View>
            {shelf.bestKept ? (
              <View style={styles.shelfMetaCol}>
                <Text style={styles.shelfMetaLabel}>BEST KEPT</Text>
                <Text style={styles.shelfMetaValue}>{shelf.bestKept}</Text>
              </View>
            ) : null}
          </View>

          {shelf.notes?.length ? (
            <View style={styles.shelfNotes}>
              {shelf.notes.map((n) => (
                <Text key={n} style={styles.shelfNoteText}>
                  • {n}
                </Text>
              ))}
            </View>
          ) : null}
        </View>

        <Section title="Ingredients" caption={`vs ${retailLabel}`}>
          {/* Pantry match indicator — shows X/Y owned + ready/almost/partial. */}
          <PantryMatchPill match={match} />

          <View style={styles.batchCard}>
            <Text style={styles.batchLabel}>Make more</Text>
            <View style={styles.batchSeg}>
              {BATCH_OPTIONS.map((b) => {
                const active = b === batch;
                return (
                  <Pressable
                    key={b}
                    accessibilityRole="button"
                    accessibilityLabel={`${b}× batch`}
                    onPress={() => {
                      tapSoft();
                      setBatch(b);
                    }}
                    style={({ pressed }) => [
                      styles.batchPill,
                      active && styles.batchPillActive,
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.batchPillText,
                        active && styles.batchPillTextActive,
                      ]}
                    >
                      {b}×
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.ingredientList}>
            {recipe.ingredients.map((ing, i) => {
              // Two ingredient shapes flow through here:
              //   1. Hero recipes: { name: "Castile soap", amount: "2 tbsp" }
              //   2. v3 bridge:    { name: "2 cups epsom salt", amount: "" }
              //
              // For shape #2 the multiplier was a no-op because scaleAmount
              // received an empty string. We detect that case and scale the
              // name itself — scaleAmount already parses leading quantities
              // out of any string, so "2 cups epsom salt" × 5 becomes
              // "10 cups epsom salt". Then we render the scaled string as
              // the primary line and leave the meta empty.
              const isFlatLine = !ing.amount;
              const displayName = isFlatLine
                ? scaleAmount(ing.name, batch)
                : ing.name;
              const displayAmount = isFlatLine
                ? ''
                : scaleAmount(ing.amount, batch);
              const helpQuery = `${displayAmount} ${displayName}`.trim();
              const showHelp = hasIngredientHelp(helpQuery);
              return (
                <View
                  key={ing.name}
                  style={[styles.ingredientRow, i === 0 && { borderTopWidth: 0 }]}
                >
                  <View style={[styles.ingDot, ing.haveIt && styles.ingDotHave]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ingName}>{displayName}</Text>
                    <Text style={styles.ingMeta}>
                      {displayAmount}
                      {ing.haveIt
                        ? `${displayAmount ? ' · ' : ''}in your pantry`
                        : ''}
                    </Text>
                  </View>
                  {ing.storePriceUsd != null ? (
                    <Text style={styles.ingPrice}>
                      {formatMoney(ing.storePriceUsd * batch, { currency })}
                    </Text>
                  ) : null}
                  {showHelp ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Help: ${ing.name}`}
                      hitSlop={8}
                      onPress={() => {
                        tapLight();
                        setHelpFor(helpQuery);
                      }}
                      style={({ pressed }) => [
                        styles.helpBtn,
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      <Ionicons
                        name="help"
                        size={14}
                        color={Colors.light.sageDeep}
                      />
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
          </View>
        </Section>

        <Section title="Steps" caption={`${recipe.steps.length} simple steps`}>
          <View style={styles.steps}>
            {recipe.steps.map((s, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>{i + 1}</Text>
                </View>
                <Text style={styles.stepText}>{s}</Text>
              </View>
            ))}
          </View>
        </Section>

        {/* Best For — auto-derived from ingredient intelligence. Falls back
            silently when none of the ingredients have intel entries. */}
        {intelBestFor.length > 0 ? (
          <Section title="Best for" caption="What this recipe shines at">
            <View style={styles.intelChipsWrap}>
              {intelBestFor.slice(0, 8).map((tag) => (
                <View key={tag} style={styles.intelChip}>
                  <Text style={styles.intelChipText}>{tag}</Text>
                </View>
              ))}
            </View>
          </Section>
        ) : null}

        {/* Avoid If — surface contexts the user should NOT use this recipe
            on/around (granite, pets for tea-tree-oil recipes, etc.) */}
        {intelAvoidIf.length > 0 ? (
          <Section title="Avoid if" caption="Skip this recipe in these cases">
            <View style={styles.intelAvoidWrap}>
              {intelAvoidIf.slice(0, 8).map((tag) => (
                <View key={tag} style={styles.intelAvoidRow}>
                  <Ionicons name="close-circle-outline" size={14} color={Colors.light.danger} />
                  <Text style={styles.intelAvoidText}>{tag}</Text>
                </View>
              ))}
            </View>
          </Section>
        ) : null}

        <Section title="Safety tips" caption="Read before you mix">
          <View style={styles.warningCard}>
            {/* Hand-curated warnings on the recipe itself. */}
            {recipe.warnings.map((w, i) => (
              <View key={`warn-${i}`} style={styles.warningRow}>
                <Ionicons name="alert-circle" size={16} color={Colors.light.danger} />
                <Text style={styles.warningText}>{w}</Text>
              </View>
            ))}
            {/* Auto-derived safety notes from ingredient intel — only fire
                when an actual incompatibility is present in the recipe. */}
            {intelSafety.map((note, i) => (
              <View key={`intel-${i}`} style={styles.warningRow}>
                <Ionicons name="information-circle" size={16} color={Colors.light.sageDeep} />
                <Text style={styles.warningText}>{note}</Text>
              </View>
            ))}
          </View>
        </Section>

        <Section title="Smart swaps" caption="If you're missing something">
          <SmartSwapsBlock recipe={recipe} />
        </Section>

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerActions}>
          <Pressable
            style={({ pressed }) => [styles.smallAction, pressed && { opacity: 0.7 }]}
            onPress={() => router.push('/categories')}
          >
            <Ionicons name="refresh" size={18} color={Colors.light.text} />
            <Text style={styles.smallActionText}>Make another</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <PrimaryButton
              label="Shopping list"
              leadingIcon="cart-outline"
              onPress={() => router.push({ pathname: '/shopping-list', params: { id: product.id } })}
            />
          </View>
        </View>
      </View>

      <IngredientHelpSheet
        ingredient={helpFor}
        visible={helpFor !== null}
        onClose={() => setHelpFor(null)}
        onAddToShoppingList={() => {
          // Future: persist to a personal shopping list. For now the sheet
          // shows its own "Added to list" confirmation and the screen-level
          // shopping list is reachable via the footer button.
        }}
      />
    </SafeAreaView>
  );
}

function Stat({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  highlight?: boolean;
}) {
  return (
    <View style={[styles.stat, highlight && styles.statHighlight]}>
      <View style={[styles.statIcon, highlight && styles.statIconHighlight]}>
        <Ionicons name={icon} size={14} color={highlight ? '#FFFFFF' : Colors.light.sageDeep} />
      </View>
      <Text style={[styles.statValue, highlight && styles.statValueHighlight]}>{value}</Text>
      <Text style={[styles.statLabel, highlight && styles.statLabelHighlight]}>{label}</Text>
    </View>
  );
}

function PantryMatchPill({
  match,
}: {
  match: ReturnType<typeof computeMatch>;
}) {
  // Color theme per status — sage for ready, gold for almost, neutral for partial.
  const tone =
    match.status === 'ready'
      ? { bg: Colors.light.sageSoft, fg: Colors.light.sageDeep, border: Colors.light.sage }
      : match.status === 'almost'
        ? { bg: Colors.light.cream, fg: '#A98A4D', border: Colors.light.creamDeep }
        : { bg: Colors.light.surface, fg: Colors.light.textMuted, border: Colors.light.border };
  const copy = MATCH_COPY[match.status];
  return (
    <View style={[styles.matchPill, { backgroundColor: tone.bg, borderColor: tone.border }]}>
      <View style={[styles.matchIcon, { backgroundColor: '#FFFFFF' }]}>
        <Ionicons
          name={
            match.status === 'ready'
              ? 'checkmark-circle'
              : match.status === 'almost'
                ? 'time-outline'
                : 'cart-outline'
          }
          size={14}
          color={tone.fg}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.matchLabel, { color: tone.fg }]}>{copy.label}</Text>
        <Text style={styles.matchSub}>
          {match.matched.length} of {match.total} in your pantry
          {match.missing.length > 0 && match.missing.length <= 3
            ? ` · missing ${match.missing.length === 1 ? extractIngredientName(match.missing[0]) : `${match.missing.length} items`}`
            : ''}
        </Text>
      </View>
    </View>
  );
}

function Section({ title, caption, children }: { title: string; caption?: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {caption ? <Text style={styles.sectionCaption}>{caption}</Text> : null}
      </View>
      {children}
    </View>
  );
}

// Smart Swaps — derives per-ingredient alternatives from the central
// SMART_SWAPS lookup, augmented with the recipe's curated `substitutions`
// pairs (when present, e.g. on hero recipes).
//
// Render strategy:
//   - One row per recipe ingredient that has at least one swap
//   - Each row shows the original name + 1–3 alternatives (chips) with
//     reason + ratio
//   - If ZERO ingredients have swaps, show the calm fallback message
function SmartSwapsBlock({
  recipe,
}: {
  recipe: { ingredients: { name: string; amount: string }[]; substitutions: { swap: string; for: string }[] };
}) {
  // Build per-ingredient swap groups. Skip ingredients with no swaps so we
  // don't render empty rows.
  const groups: { original: string; swaps: SmartSwap[] }[] = [];
  for (const ing of recipe.ingredients) {
    // Two ingredient shapes flow through: hero ({name, amount}) and
    // v3-bridge ({name: "2 cups epsom salt", amount: ""}). The extractor
    // handles both since it strips numbers + units.
    const display = ing.amount ? ing.name : extractIngredientName(ing.name);
    const swaps = getSmartSwaps(ing.amount ? ing.name : ing.name);
    if (swaps.length > 0) {
      groups.push({
        original: capitalize(display),
        swaps: swaps.slice(0, 3),
      });
    }
  }

  // Layer the recipe's curated substitution pairs in too. These are the
  // "this recipe specifically suggests X for Y" overrides on hero recipes.
  // We synthesize a SmartSwap entry per pair so they render in the same
  // visual treatment.
  const curatedGroups: { original: string; swaps: SmartSwap[] }[] = recipe.substitutions
    .map((s) => ({
      original: capitalize(s.for),
      swaps: [{ name: s.swap, reason: 'Recommended swap for this recipe', ratio: '1:1' }],
    }));

  // De-dupe: if a curated entry matches an auto-generated one (same `for`),
  // keep the curated version since it's hand-written for this recipe.
  const merged = [...curatedGroups];
  for (const g of groups) {
    if (!merged.some((m) => m.original.toLowerCase() === g.original.toLowerCase())) {
      merged.push(g);
    }
  }

  if (merged.length === 0) {
    return (
      <View style={styles.swapEmpty}>
        <Ionicons name="sparkles-outline" size={14} color={Colors.light.sageDeep} />
        <Text style={styles.swapEmptyText}>
          No swaps available yet for this recipe — we&apos;re expanding this soon.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.swapList}>
      {merged.map((g, i) => (
        <View
          key={`${g.original}-${i}`}
          style={[styles.swapGroup, i === 0 && { borderTopWidth: 0 }]}
        >
          <View style={styles.swapHeaderRow}>
            <View style={styles.swapDot} />
            <Text style={styles.swapOriginal}>{g.original}</Text>
          </View>
          <View style={styles.swapAlts}>
            {g.swaps.map((s) => (
              <View key={s.name} style={styles.swapAlt}>
                <View style={styles.swapAltHeader}>
                  <Ionicons
                    name="arrow-forward"
                    size={12}
                    color={Colors.light.sageDeep}
                  />
                  <Text style={styles.swapAltName}>{s.name}</Text>
                  <View style={styles.swapRatioPill}>
                    <Text style={styles.swapRatioText}>{s.ratio}</Text>
                  </View>
                </View>
                <Text style={styles.swapAltReason}>{s.reason}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
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
  topActions: { flexDirection: 'row', gap: Spacing.sm },
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
  iconBtnActive: { backgroundColor: Colors.light.sageDeep, borderColor: Colors.light.sageDeep },
  scroll: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl },
  heroCard: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadow.card,
  },
  heroEmoji: { fontSize: 56 },
  heroIcon: { width: 120, height: 120 },
  heroTitle: { ...Type.hero, color: Colors.light.text, marginTop: Spacing.md, textAlign: 'center' },
  heroBlurb: { ...Type.body, color: Colors.light.textMuted, marginTop: Spacing.sm, textAlign: 'center' },
  heroTags: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg, flexWrap: 'wrap', justifyContent: 'center' },
  heroTag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: '#FFFFFFCC',
  },
  heroTagText: { ...Type.caption, color: Colors.light.text },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg },
  stat: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'flex-start',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  statHighlight: { backgroundColor: Colors.light.sageDeep, borderColor: Colors.light.sageDeep },
  statIcon: {
    width: 26,
    height: 26,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconHighlight: { backgroundColor: '#FFFFFF22' },
  statValue: { ...Type.bodyStrong, color: Colors.light.text },
  statValueHighlight: { color: '#FFFFFF' },
  statLabel: { ...Type.caption, color: Colors.light.textMuted },
  statLabelHighlight: { color: '#FFFFFFC0' },
  impactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.sageSoft,
    borderWidth: 1,
    borderColor: Colors.light.sage,
    alignSelf: 'flex-start',
  },
  impactText: {
    ...Type.caption,
    color: Colors.light.sageDeep,
    fontWeight: '600',
  },
  impactSubtle: {
    color: Colors.light.textMuted,
    fontWeight: '500',
  },
  section: { marginTop: Spacing.xxl },
  sectionHeader: { marginBottom: Spacing.md },
  sectionTitle: { ...Type.sectionTitle, color: Colors.light.text },
  sectionCaption: { ...Type.caption, color: Colors.light.textMuted, marginTop: 2 },
  ingredientList: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  ingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.textSubtle,
  },
  ingDotHave: { backgroundColor: Colors.light.sage },
  ingName: { ...Type.bodyStrong, color: Colors.light.text },
  ingMeta: { ...Type.caption, color: Colors.light.textMuted, marginTop: 2 },
  ingPrice: { ...Type.caption, color: Colors.light.textMuted },
  helpBtn: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: Colors.light.cream,
    borderWidth: 1,
    borderColor: Colors.light.creamDeep,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  benefitsCard: {
    marginTop: Spacing.xxl,
    padding: 18,
    borderRadius: Radius.lg,
    backgroundColor: Colors.light.cream,
    borderWidth: 1,
    borderColor: Colors.light.creamDeep,
  },
  benefitsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  benefitsEyebrow: {
    fontSize: 11,
    letterSpacing: 1.6,
    fontWeight: '700',
    color: Colors.light.sageDeep,
    textTransform: 'uppercase',
  },
  benefitsList: { gap: 8 },
  benefitRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  benefitDot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: Colors.light.sageDeep,
    marginTop: 8,
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.text,
    fontWeight: '500',
  },
  benefitsDivider: {
    height: 1,
    backgroundColor: Colors.light.creamDeep,
    marginVertical: 14,
  },
  benefitsMetaBlock: { gap: 6, marginBottom: 4 },
  benefitsMetaLabel: {
    fontSize: 10.5,
    letterSpacing: 1.4,
    fontWeight: '700',
    color: Colors.light.textMuted,
  },
  benefitsMetaValue: {
    fontSize: 13.5,
    color: Colors.light.text,
    fontWeight: '500',
  },
  bestForRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  bestForChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    backgroundColor: '#FFFFFFCC',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  bestForText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: Colors.light.text,
    letterSpacing: 0.2,
  },
  whyItWorksText: {
    fontSize: 13.5,
    lineHeight: 20,
    color: Colors.light.text,
    fontWeight: '500',
    fontStyle: 'italic',
  },

  shelfCard: {
    marginTop: Spacing.md,
    padding: 18,
    borderRadius: Radius.lg,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  shelfHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  shelfEyebrow: {
    fontSize: 11,
    letterSpacing: 1.6,
    fontWeight: '700',
    color: Colors.light.sageDeep,
    textTransform: 'uppercase',
  },
  shelfDuration: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
    letterSpacing: -0.4,
    marginBottom: 12,
  },
  shelfBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  shelfBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.sageSoft,
    borderWidth: 1,
    borderColor: Colors.light.sage,
  },
  shelfBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: Colors.light.sageDeep,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  shelfMetaRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 10,
  },
  shelfMetaCol: { flex: 1, gap: 4 },
  shelfMetaLabel: {
    fontSize: 10,
    letterSpacing: 1.4,
    fontWeight: '700',
    color: Colors.light.textMuted,
  },
  shelfMetaValue: {
    fontSize: 13,
    color: Colors.light.text,
    fontWeight: '600',
    lineHeight: 17,
  },
  shelfNotes: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    gap: 4,
  },
  shelfNoteText: {
    fontSize: 12.5,
    lineHeight: 17,
    color: Colors.light.textMuted,
    fontWeight: '500',
  },

  batchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    paddingLeft: 16,
    marginBottom: 10,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.cream,
    borderWidth: 1,
    borderColor: Colors.light.creamDeep,
  },
  batchLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.light.text,
    letterSpacing: 0.2,
  },
  batchSeg: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFFCC',
    borderRadius: Radius.pill,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  batchPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  batchPillActive: {
    backgroundColor: Colors.light.sageDeep,
  },
  batchPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.text,
    letterSpacing: 0.3,
  },
  batchPillTextActive: {
    color: '#FFFFFF',
  },
  steps: { gap: Spacing.md },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.sageDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: { ...Type.caption, color: '#FFFFFF', fontWeight: '700' },
  stepText: { ...Type.body, color: Colors.light.text, flex: 1, lineHeight: 22 },
  warningCard: {
    backgroundColor: '#FBEFEC',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: '#F1D9D2',
  },
  warningRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  warningText: { ...Type.caption, color: '#7A3B2C', flex: 1, lineHeight: 18 },
  subsList: {
    backgroundColor: Colors.light.cream,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.creamDeep,
  },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  subSwap: { ...Type.bodyStrong, color: Colors.light.text },
  subFor: { ...Type.body, color: Colors.light.textMuted, flex: 1 },

  // Smart Swaps — per-ingredient alternatives.
  swapList: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
  },
  swapGroup: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    gap: 8,
  },
  swapHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  swapDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: Colors.light.sageDeep,
  },
  swapOriginal: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.light.text,
    letterSpacing: -0.2,
  },
  swapAlts: { gap: 8, paddingLeft: 16 },
  swapAlt: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.light.cream,
    borderWidth: 1,
    borderColor: Colors.light.creamDeep,
    gap: 4,
  },
  swapAltHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  swapAltName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.text,
    letterSpacing: -0.1,
  },
  swapRatioPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.light.creamDeep,
  },
  swapRatioText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.sageDeep,
    letterSpacing: 0.4,
  },
  swapAltReason: {
    fontSize: 11.5,
    color: Colors.light.textMuted,
    lineHeight: 16,
    paddingLeft: 18,
  },
  // -- Pantry match pill ------------------------------------------------
  matchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  matchIcon: {
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  matchSub: {
    fontSize: 11.5,
    color: Colors.light.textMuted,
    marginTop: 2,
  },

  // -- Best For / Avoid If chips ----------------------------------------
  intelChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  intelChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: Colors.light.sageSoft,
    borderWidth: 1,
    borderColor: Colors.light.sage,
  },
  intelChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.sageDeep,
    textTransform: 'capitalize',
  },
  intelAvoidWrap: {
    backgroundColor: '#FBEFEC',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#F1D9D2',
    padding: 12,
    gap: 8,
  },
  intelAvoidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  intelAvoidText: {
    fontSize: 12.5,
    color: '#7A3B2C',
    fontWeight: '500',
    textTransform: 'capitalize',
  },

  swapEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: Radius.lg,
    backgroundColor: Colors.light.sageSoft,
    borderWidth: 1,
    borderColor: Colors.light.creamDeep,
  },
  swapEmptyText: {
    flex: 1,
    fontSize: 12.5,
    color: Colors.light.text,
    fontWeight: '500',
    lineHeight: 17,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  smallAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
  },
  smallActionText: { ...Type.caption, color: Colors.light.text },
});
