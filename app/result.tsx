import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { IngredientHelpSheet } from '@/components/ingredient-help-sheet';
import { PrimaryButton } from '@/components/primary-button';
import RecipeHero from '@/components/recipe-hero';
import { formatMoney, useCurrency } from '@/constants/currency';
import { hasIngredientHelp } from '@/constants/ingredient-help';
import { findProduct, findRecipe } from '@/constants/products';
import { autoBullets, benefitsFor } from '@/constants/recipe-benefits';
import { findRecipeById, useAllRecipes } from '@/constants/recipes-remote';
import { shelfLifeFor } from '@/constants/recipe-shelf-life';
import { computeSavings, formatRange } from '@/constants/savings';
import { FreemiumModal, type FreemiumKind } from '@/components/freemium-modal';
import { events } from '@/lib/analytics';
import { useAuth } from '@/lib/auth';
import { shareRecipe } from '@/lib/share-recipe';
import {
  addRecipeToList,
  useShoppingList,
} from '@/lib/shopping-list-store';
import {
  avoidIfFromIngredients,
  bestForFromIngredients,
  safetyNotesFromIngredients,
} from '@/constants/ingredient-intel';
import { extractIngredientName, getSmartSwaps, type SmartSwap } from '@/constants/smart-swaps';
import { tapLight, tapSoft } from '@/lib/haptics';
import { computeMatch, MATCH_COPY, pantryKeyForIngredient } from '@/lib/pantry-match';
import { usePantry } from '@/lib/pantry-store';
import { recordRecipeView } from '@/lib/recent-recipes';
import { recipeHeroImage } from '@/constants/recipeHeroImages';
import SaveToCollectionSheet from '@/components/save-to-collection-sheet';
import {
  isRecipeInAnyCollection,
  useCollections,
} from '@/lib/collections-store';
import { scaleAmount } from '@/lib/scale-amount';
import { saveRecipe as saveRecipeRow, toggleSaved, useSavedRecipes } from '@/lib/saved-recipes';
import { Colors, Radius, Spacing, Type } from '@/constants/theme';

const BATCH_OPTIONS = [1, 2, 3, 5] as const;
type BatchSize = (typeof BATCH_OPTIONS)[number];

// Muted sage-gray used for secondary actions (icon + label) so they
// stay visible without competing visually with the primary CTA.
const SECONDARY_ACTION_COLOR = '#6B7D73';

export default function Result() {
  // `save` is set by the /auth/sign-up return URL — when a guest taps
  // the heart we route them straight to sign-up with next=/result?id=…
  // &save=<id>, AuthForm replaces back here on success, and the useEffect
  // below picks the param up to resume the save the user started.
  const { id, save: saveTrigger } = useLocalSearchParams<{
    id?: string;
    save?: string;
  }>();
  // Subscribe to the remote-recipes store so the screen re-renders
  // when Supabase sync lands. findProduct/findRecipe internally read
  // the same snapshot via getAllRecipes(); without this subscription,
  // a curated recipe opened BEFORE sync completes would render with
  // the bathroom-cleaner fallback and never refresh.
  useAllRecipes();
  const product = findProduct(id);
  const recipe = findRecipe(id);
  const { currency } = useCurrency();
  const { saved: savedMap } = useSavedRecipes();
  const saved = savedMap.has(product.id);
  // Read the safe-area top inset at runtime so the floating topBar
  // sits BELOW the status bar / Dynamic Island instead of fusing with
  // it. SafeAreaView's edges={['top']} adds paddingTop to the view's
  // content area but doesn't shift absolutely-positioned children, so
  // we apply the inset directly to the topBar.
  const insets = useSafeAreaInsets();
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
  const [saveSheetOpen, setSaveSheetOpen] = useState(false);
  const [savedToast, setSavedToast] = useState<string | null>(null);
  // Auth gate on save — when a guest taps the heart we stash the id of
  // the recipe they wanted to save and route straight to /auth/sign-up
  // with a return URL. After successful auth (OAuth in-place OR email
  // signup return with ?save=<id>), the resume effect below completes
  // the save automatically so the user doesn't have to re-tap.
  const { user } = useAuth();
  const [pendingSaveId, setPendingSaveId] = useState<string | null>(null);
  // Single-fire guard for the resume effect — prevents firing the save
  // (and the feedback animation) more than once per resume.
  const resumedSaveRef = useRef(false);
  // Animated "Saved ✓" pill shown after the auth-resume save completes.
  // Drives the visible pill via `showSavedFeedback`; the Animated values
  // own the fade + spring scale.
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);
  const savedFeedbackOpacity = useRef(new Animated.Value(0)).current;
  const savedFeedbackScale = useRef(new Animated.Value(0.8)).current;

  // Shopping-list toast — shown after "Add to List" lands a recipe's
  // ingredients in the persistent shopping list. Carries the latest
  // count via the live shopping-list snapshot so the CTA always reads
  // the true total (covers the "user added 3 from this recipe and
  // already had 2 from another" case).
  const shoppingList = useShoppingList();
  const [listToast, setListToast] = useState<string | null>(null);

  // Subscribe so the heart icon flips state instantly when a collection
  // is added/removed, without requiring a re-render through saved-recipes.
  const collections = useCollections();
  const inAnyCollection = collections.some((c) =>
    c.recipeIds.includes(product.id),
  );
  // Heart fills if either: (a) the recipe is in any local collection, or
  // (b) it was saved through the legacy single-bucket flow before
  // collections existed. Both states should look "saved" to the user.
  const heartFilled = saved || inAnyCollection;

  const onToggleSave = () => {
    tapLight();
    // Removing? Skip the sheet — direct unsave keeps the one-tap UX
    // the user already had. Adding? Open the collection picker so the
    // user can land it in the right bucket.
    if (heartFilled) {
      void (async () => {
        const { gated, needsAuth } = await toggleSaved(product.id);
        if (gated) setGateModal('save');
        else if (needsAuth)
          router.push({
            pathname: '/auth/sign-up',
            params: { next: `/result?id=${encodeURIComponent(product.id)}` },
          });
        // If we just unsaved via the legacy flow, also strip the recipe
        // out of every collection so the visual state stays consistent.
        const { getCollections, removeRecipeFromCollection } = await import(
          '@/lib/collections-store'
        );
        for (const c of getCollections()) {
          if (c.recipeIds.includes(product.id)) {
            await removeRecipeFromCollection(c.id, product.id);
          }
        }
      })();
      return;
    }
    // Guest add — route straight to /auth/sign-up. We stash the recipe
    // id so the resume effect below auto-completes the save once the
    // user lands back here via the ?save=<id> return URL. The
    // intermediate "Save this recipe" modal was removed because tapping
    // any of its buttons routed here anyway — one extra tap with no
    // signal value.
    if (!user) {
      setPendingSaveId(product.id);
      resumedSaveRef.current = false;
      router.push({
        pathname: '/auth/sign-up',
        params: {
          next: `/result?id=${encodeURIComponent(product.id)}&save=${encodeURIComponent(product.id)}`,
        },
      });
      return;
    }
    setSaveSheetOpen(true);
  };

  // Auto-dismiss the "Saved to ..." toast after a couple of seconds.
  useEffect(() => {
    if (!savedToast) return;
    const t = setTimeout(() => setSavedToast(null), 2200);
    return () => clearTimeout(t);
  }, [savedToast]);

  // Auto-dismiss the "Added to your shopping list" toast. 3s gives the
  // user enough time to register the count change AND tap "View List"
  // before it slides away.
  useEffect(() => {
    if (!listToast) return;
    const t = setTimeout(() => setListToast(null), 3000);
    return () => clearTimeout(t);
  }, [listToast]);

  // Resume-after-auth: when the user signs in (OAuth lands them back
  // here directly; email signup replaces back via ?save=<id>), the
  // recipe they originally tapped to save lands in their library
  // AUTOMATICALLY — no second tap, no collection picker.
  // That's the spec's "frictionless" point: by the time the user is
  // signed in, the recipe is already saved.
  //
  // We bypass the SaveToCollectionSheet on this path on purpose. The
  // user can still re-categorize from /saved later; here we optimize
  // for completing the action they already started.
  useEffect(() => {
    if (!user) return;
    if (resumedSaveRef.current) return;
    const target =
      pendingSaveId ?? (typeof saveTrigger === 'string' ? saveTrigger : null);
    if (!target || target !== product.id) return;
    resumedSaveRef.current = true;
    setPendingSaveId(null);
    void (async () => {
      // Direct save — lands in the default favorites bucket. The
      // saved-recipes store hydrates from Supabase on auth so the
      // hearted state on this screen flips to "saved" as soon as the
      // round-trip completes.
      const { error } = await saveRecipeRow(product.id);
      if (error) {
        // eslint-disable-next-line no-console
        console.warn('[result] auto-save after auth failed:', error);
        return;
      }
      // Trigger the animated "Saved ✓" pill. Spring + fade so the
      // moment feels intentional but never showy. Spec: ~1 second
      // total presence on screen.
      setShowSavedFeedback(true);
    })();
    // Drop the ?save= param so a back-swipe doesn't re-trigger this
    // on a return visit. The ref guard above is the real defense;
    // this is just URL hygiene.
    if (saveTrigger) {
      router.setParams({ save: undefined as never });
    }
  }, [user, pendingSaveId, saveTrigger, product.id]);

  // Drive the pill's animated entry / exit. Spring in (scale 0.8 → 1
  // + fade), hold ~900ms, fade + scale out, then unmount.
  useEffect(() => {
    if (!showSavedFeedback) return;
    savedFeedbackOpacity.setValue(0);
    savedFeedbackScale.setValue(0.8);
    Animated.parallel([
      Animated.spring(savedFeedbackScale, {
        toValue: 1,
        useNativeDriver: true,
        damping: 14,
        stiffness: 200,
      }),
      Animated.timing(savedFeedbackOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(savedFeedbackOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(savedFeedbackScale, {
          toValue: 0.94,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setShowSavedFeedback(false);
      });
    }, 900);
    return () => clearTimeout(t);
  }, [showSavedFeedback, savedFeedbackOpacity, savedFeedbackScale]);
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

  // No `edges` on the SafeAreaView below: we want the hero photo to
  // extend UNDER the status bar / Dynamic Island for a true full-bleed
  // look. The floating topBar (which DOES need to clear the status bar)
  // handles its own clearance via `paddingTop: insets.top + 8`, so
  // removing the SafeAreaView's top inset is safe.
  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <FreemiumModal
        visible={gateModal !== null}
        kind={gateModal ?? 'save'}
        onClose={() => setGateModal(null)}
      />
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
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
            onPress={() => {
              tapLight();
              // Plain-text recipe share — no URL, no deep link. The
              // message body is built in lib/share-recipe.ts; we hand it
              // a payload assembled from the fields the UI already has
              // in scope: blurb (description), v3 time, the same
              // flattened ingredient strings rendered on screen, and
              // the curated benefits + autoBullets list.
              void shareRecipe({
                title: recipe.title,
                description: recipe.blurb,
                time: v3Recipe?.time ?? '',
                ingredients: flatIngredients,
                benefits: allBullets,
              });
            }}
          >
            <Ionicons name="share-outline" size={18} color={Colors.light.text} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={heartFilled ? 'Saved' : 'Save'}
            style={({ pressed }) => [
              styles.iconBtn,
              heartFilled && styles.iconBtnActive,
              pressed && { opacity: 0.6 },
            ]}
            onPress={onToggleSave}
          >
            <Ionicons
              name={heartFilled ? 'heart' : 'heart-outline'}
              size={18}
              color={heartFilled ? '#FFFFFF' : Colors.light.text}
            />
          </Pressable>
        </View>
      </View>

      {/* Collection picker — opens when the user taps the heart on an
          unsaved recipe. Removing from saved still uses the one-tap
          path (no sheet) so the legacy UX is preserved. */}
      <SaveToCollectionSheet
        visible={saveSheetOpen}
        recipeId={product.id}
        onClose={() => setSaveSheetOpen(false)}
        onSaved={(name) => setSavedToast(`Saved to ${name}`)}
        onGated={() => {
          setSaveSheetOpen(false);
          setGateModal('save');
        }}
      />

      {/* Saved-confirmation toast. Floats above the footer; auto-dismisses
          after a couple of seconds (see useEffect that tracks savedToast). */}
      {savedToast ? (
        <View style={styles.toast} pointerEvents="none">
          <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
          <Text style={styles.toastText}>{savedToast}</Text>
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Full-bleed hero. Title + subtitle render INSIDE the hero so
            they sit on the gradient and visually merge with the photo;
            the gradient terminates in the page background color, so the
            hero's bottom edge has no visible seam. Negative horizontal
            margin breaks the image out of the ScrollView's content
            padding so it runs edge-to-edge. */}
        <RecipeHero
          image={recipeHeroImage(product.id, v3Recipe?.categoryKey)}
          title={recipe.title}
          subtitle={recipe.blurb}
          style={styles.heroBleed}
          testID="pc-recipe-icon"
        />
        <View style={styles.heroTags}>
          {product.tags.map((t, i) => (
            <View key={`${t}-${i}`} style={styles.heroTag}>
              <Text style={styles.heroTagText}>{t}</Text>
            </View>
          ))}
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
            {allBullets.map((b, i) => (
              <View key={`${b}-${i}`} style={styles.benefitRow}>
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
                {benefits.bestFor.map((tag, i) => (
                  <View key={`${tag}-${i}`} style={styles.bestForChip}>
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
              {shelf.badges.map((badge, i) => (
                <View key={`${badge}-${i}`} style={styles.shelfBadge}>
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
              {shelf.notes.map((n, i) => (
                <Text key={`${n}-${i}`} style={styles.shelfNoteText}>
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
              // "In your pantry" reflects LIVE pantry state, not the static
              // `haveIt` flag on the recipe. The static flag was demo data
              // that never updated when a tester added items to their pantry
              // (e.g. eucalyptus oil), so recipes appeared to ignore what
              // the user already owned. We resolve the canonical pantry key
              // via the same alias logic computeMatch() uses so detail
              // view and PantryMatchPill stay in sync.
              const ingredientText = ing.amount
                ? `${ing.amount} ${ing.name}`
                : ing.name;
              const pantryKey = pantryKeyForIngredient(ingredientText);
              const haveIt = pantryKey ? pantry.has(pantryKey) : false;
              return (
                <View
                  key={ing.name}
                  style={[styles.ingredientRow, i === 0 && { borderTopWidth: 0 }]}
                >
                  <View style={[styles.ingDot, haveIt && styles.ingDotHave]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ingName}>{displayName}</Text>
                    <Text style={styles.ingMeta}>
                      {displayAmount}
                      {haveIt
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
              {intelBestFor.slice(0, 8).map((tag, i) => (
                <View key={`${tag}-${i}`} style={styles.intelChip}>
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
              {intelAvoidIf.slice(0, 8).map((tag, i) => (
                <View key={`${tag}-${i}`} style={styles.intelAvoidRow}>
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

      {/* Footer absorbs the bottom safe-area inset since the SafeAreaView
          above no longer applies one — this keeps the CTA out of the
          home-indicator gesture zone on iPhones with one, while devices
          without an inset (older iPhones / Android) get the static
          paddingBottom alone. */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <View style={styles.footerActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Try another recipe"
            style={({ pressed }) => [styles.smallAction, pressed && { opacity: 0.7 }]}
            onPress={() => router.push('/categories')}
          >
            {/* Compass icon reads as "explore" — better fit than the
                old refresh icon now that the copy is "Try another"
                (exploring) instead of "Make another" (repeat). */}
            <Ionicons name="compass-outline" size={18} color={SECONDARY_ACTION_COLOR} />
            <Text style={styles.smallActionText}>Try another</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <PrimaryButton
              label="Add to List"
              leadingIcon="cart-outline"
              onPress={() => {
                tapLight();
                // Add the recipe's not-haveIt ingredients to the
                // persistent shopping list. The store dedupes by
                // recipeId+name so a second tap on the same recipe
                // is a no-op rather than producing duplicates.
                const itemsToAdd = recipe.ingredients
                  .filter((i) => !i.haveIt)
                  .map((i) => ({
                    name: i.name,
                    amount: i.amount ?? '',
                  }));
                if (itemsToAdd.length === 0) {
                  setListToast('Already have everything for this one');
                  return;
                }
                void (async () => {
                  const { added, alreadyPresent } = await addRecipeToList(
                    { id: product.id, title: recipe.title },
                    itemsToAdd,
                  );
                  if (added > 0) {
                    setListToast(
                      `Added ${added} ${added === 1 ? 'item' : 'items'}`,
                    );
                  } else if (alreadyPresent > 0) {
                    setListToast('Already on your list');
                  }
                })();
              }}
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

      {/* "Added to your shopping list" toast — appears after the
          "Add to List" footer button fires, with a tappable
          "View List (N)" CTA that routes to the persistent shopping
          list. Auto-dismisses in 3s. Sits ABOVE the "Saved" pill so
          they don't overlap if both somehow trigger together. */}
      {listToast ? (
        <View style={styles.listToastWrap} pointerEvents="box-none">
          <View style={styles.listToastPill}>
            <Ionicons name="cart" size={14} color="#FFFFFF" />
            <Text style={styles.listToastText}>{listToast}</Text>
            {shoppingList.items.length > 0 ? (
              <Pressable
                onPress={() => {
                  tapLight();
                  setListToast(null);
                  router.push('/shopping-list');
                }}
                hitSlop={8}
                style={styles.listToastCta}
                accessibilityRole="button"
                accessibilityLabel={`View shopping list, ${shoppingList.items.length} items`}
              >
                <Text style={styles.listToastCtaText}>
                  View list ({shoppingList.items.length})
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}

      {/* "Saved ✓" pill — overlays content, fades in after the auth-
          resume save lands, holds for ~900ms, fades out. Sage pill so
          it reads as "good news" instead of a system toast.
          pointerEvents:none keeps it out of the touch path so it never
          blocks interaction with the screen behind. */}
      {showSavedFeedback ? (
        <View style={styles.savedFeedbackWrap} pointerEvents="none">
          <Animated.View
            style={[
              styles.savedFeedbackPill,
              {
                opacity: savedFeedbackOpacity,
                transform: [{ scale: savedFeedbackScale }],
              },
            ]}
          >
            <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
            <Text style={styles.savedFeedbackText}>Saved</Text>
          </Animated.View>
        </View>
      ) : null}
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
            {g.swaps.map((s, i) => (
              <View key={`${s.name}-${i}`} style={styles.swapAlt}>
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
  // Top bar floats over the hero photo so the image runs edge-to-edge
  // top-to-bottom of the screen. zIndex keeps the buttons above the
  // ScrollView's contents. paddingTop is applied INLINE at the call
  // site using useSafeAreaInsets so the buttons clear the status bar
  // / Dynamic Island regardless of device — that runtime value can't
  // live in StyleSheet.create.
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  topActions: { flexDirection: 'row', gap: Spacing.sm },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
    // Solid white background so the buttons stay legible whether they
    // sit on a light or dark area of the underlying hero image.
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    // Subtle shadow so the buttons read as "floating" cards.
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 2,
  },
  iconBtnActive: { backgroundColor: Colors.light.sageDeep, borderColor: Colors.light.sageDeep },
  scroll: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl },
  // Negative margins pull the hero out of the ScrollView's horizontal
  // padding so the image runs edge-to-edge horizontally; the floating
  // topBar (position: absolute) lets the image sit flush with the top
  // of the safe area without a header gap. No marginBottom — the hero
  // gradient already terminates in the page background, and the tags
  // row provides its own top spacing.
  heroBleed: {
    marginHorizontal: -Spacing.xl,
  },
  heroTags: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  heroTag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
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
  // Secondary action — intentionally lighter than the Shopping List
  // CTA. Muted sage-gray (#6B7D73) keeps the option visible without
  // competing for attention with the primary green button.
  smallActionText: {
    fontSize: 16,
    fontWeight: '500',
    color: SECONDARY_ACTION_COLOR,
  },
  // Floating "Saved to <collection>" confirmation. Sits above the footer
  // (bottom: 100ish) and is non-interactive so taps pass through.
  toast: {
    position: 'absolute',
    bottom: 96,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: Colors.light.text,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  // "Added to your shopping list" toast wrapper. Sits a bit higher
  // than the existing toasts (bottom: 132) so its "View list" CTA
  // doesn't collide with the footer button the user just tapped.
  listToastWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 132,
    alignItems: 'center',
  },
  listToastPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 8,
    borderRadius: 24,
    backgroundColor: Colors.light.text,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  listToastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  listToastCta: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: Colors.light.sageDeep,
    marginLeft: 4,
  },
  listToastCtaText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // "Saved ✓" feedback pill — separate from the static "Saved to <X>"
  // toast above so the auth-resume case has a brief, scaled-in
  // animation instead of inheriting the static toast's hard show/hide.
  savedFeedbackWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 120,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  savedFeedbackPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: Colors.light.sageDeep,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  savedFeedbackText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
