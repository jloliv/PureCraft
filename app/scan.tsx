// Scan to Recreate — real camera + Claude Vision OCR + ingredient matching.
//
// Flow:
//   1. Mount permission gate (asks for camera access if not yet granted).
//   2. `aim` — live camera preview with viewfinder overlay.
//   3. User taps the shutter → capture photo at base64 quality 0.6.
//   4. Send to `scan-label` Edge Function (Claude Vision returns structured
//      brand / product_name / canonical ingredients / confidence).
//   5. Match against the live `useAllRecipes()` catalog via ingredient
//      overlap + product-type bonus.
//   6. Show tiered result: high / close / alternative or fallback for
//      unreadable photos with a manual category picker.

import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FreemiumModal, type FreemiumKind } from '@/components/freemium-modal';
import { useAllRecipes } from '@/constants/recipes-remote';
import {
  checkScanGate,
  markSoftScanModalShown,
  recordScan,
} from '@/lib/freemium';
import { tapLight, tapMedium, tapSoft, success, warning } from '@/lib/haptics';
import { recipeIcon } from '@/lib/recipe-icons';
import {
  performScan,
  type LabelScan,
  type ScanMatch,
} from '@/lib/scan';

const PALETTE = {
  bg: '#F8F6F1',
  text: '#1F1F1F',
  textWarm: '#6F6A60',
  textMuted: '#8A8377',
  textSubtle: '#A8A398',
  surface: '#FFFFFF',
  border: '#E9E4DA',
  borderSoft: '#F0EADA',
  sage: '#A8B8A0',
  sageDeep: '#7E8F75',
  sageSoft: '#E4EDE5',
  cream: '#F7F2E7',
  creamDeep: '#EFE7D2',
  amber: '#9C7A4F',
  amberDeep: '#7C5C2E',
  rose: '#C26B5A',
};

type Phase = 'permission' | 'aim' | 'detecting' | 'matched' | 'unreadable';

type Result = {
  scan: LabelScan;
  match: ScanMatch;
  tier: 'high' | 'close' | 'alternative';
};

const TIER_COPY: Record<Result['tier'], { label: string; sub: string; color: string }> = {
  high: { label: 'High match', sub: 'Almost the same recipe.', color: '#5C7F6B' },
  close: { label: 'Close match', sub: 'Same job, cleaner formula.', color: '#9C7A4F' },
  alternative: {
    label: 'Cleaner alternative',
    sub: "We found something better in your library.",
    color: '#7C5C2E',
  },
};

export default function Scan() {
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<Phase>('aim');
  const [result, setResult] = useState<Result | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [gateModal, setGateModal] = useState<FreemiumKind | null>(null);
  const cameraRef = useRef<CameraView | null>(null);
  const scanY = useRef(new Animated.Value(0)).current;
  const allRecipes = useAllRecipes();

  // Permission gate — if not yet decided, ask once on mount.
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  // Scanning line animation while aiming or detecting.
  useEffect(() => {
    if (phase !== 'aim' && phase !== 'detecting') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanY, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scanY, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [phase, scanY]);

  const startCapture = async () => {
    if (!cameraRef.current) return;
    // Freemium gate — check BEFORE tying up the camera + Edge Function call.
    const gate = checkScanGate();
    if (!gate.allow) {
      tapLight();
      void markSoftScanModalShown();
      setGateModal(gate.reason === 'soft-scan' ? 'scan-soft' : 'scan-hard');
      return;
    }
    tapMedium();
    setPhase('detecting');
    setErrorMsg(null);
    try {
      // Quality 0.6 + base64 keeps payload < ~1MB. Skip processing for speed.
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.6,
        base64: true,
        skipProcessing: true,
      });
      if (!photo?.base64) {
        setErrorMsg("Couldn't capture image.");
        warning();
        setPhase('aim');
        return;
      }
      const outcome = await performScan(photo.base64, allRecipes, 'image/jpeg');
      if (outcome.kind === 'error') {
        setErrorMsg(outcome.error);
        warning();
        setPhase('aim');
        return;
      }
      if (outcome.kind === 'unreadable') {
        warning();
        setPhase('unreadable');
        setResult(null);
        setErrorMsg(outcome.reason);
        return;
      }
      success();
      setResult({ scan: outcome.scan, match: outcome.match, tier: outcome.tier });
      setPhase('matched');
      // Record the successful scan against the daily quota.
      void recordScan();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Capture failed');
      warning();
      setPhase('aim');
    }
  };

  const reset = () => {
    tapLight();
    setPhase('aim');
    setResult(null);
    setErrorMsg(null);
  };

  // ---------- Permission gate UI ------------------------------------------
  if (!permission) {
    // Permissions still loading
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator color={PALETTE.sageDeep} />
        </View>
      </SafeAreaView>
    );
  }
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
          >
            <Ionicons name="close" size={20} color={PALETTE.text} />
          </Pressable>
          <View style={{ flex: 1 }} />
        </View>
        <View style={styles.permWrap}>
          <View style={styles.permIcon}>
            <Ionicons name="camera-outline" size={28} color={PALETTE.sageDeep} />
          </View>
          <Text style={styles.permTitle}>Allow camera access</Text>
          <Text style={styles.permSub}>
            We need the camera to read product labels and match them to a clean
            PureCraft recipe. Photos never leave your phone except as the
            single label image we send for matching.
          </Text>
          <Pressable
            onPress={() => {
              tapLight();
              void requestPermission();
            }}
            style={({ pressed }) => [
              styles.permBtn,
              pressed && { opacity: 0.92 },
            ]}
          >
            <Text style={styles.permBtnText}>Enable camera</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </Pressable>
          {!permission.canAskAgain ? (
            <Text style={styles.permHint}>
              You&apos;ve denied camera access. Open Settings → PureCraft → Camera
              to allow it.
            </Text>
          ) : null}
        </View>
      </SafeAreaView>
    );
  }

  // ---------- Main UI ------------------------------------------------------
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => {
            tapLight();
            router.back();
          }}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="close" size={20} color={PALETTE.text} />
        </Pressable>
        <View style={styles.topPill}>
          <Ionicons name="scan-outline" size={13} color={PALETTE.amber} />
          <Text style={styles.topPillText}>Scan to recreate</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <FreemiumModal
        visible={gateModal !== null}
        kind={gateModal ?? 'scan-soft'}
        onClose={() => setGateModal(null)}
        onUseBonusScan={() => {
          // Soft modal "Use 1 extra scan" — close + immediately fire capture.
          setGateModal(null);
          // Manually flag the bonus by recording the scan first; the gate
          // will then reject "soft" and let recordScan increment the bonus
          // counter inside performScan. But we want to allow without re-
          // triggering the modal, so just call startCapture again — the
          // gate now rolls over to bonusScans being available.
          setTimeout(() => {
            // Fire-and-forget; we're effectively granting one bonus.
            void (async () => {
              // Record the bonus *up front* so checkScanGate becomes allow.
              await recordScan();
              await startCapture();
            })();
          }, 200);
        }}
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>SCAN</Text>
        <Text style={styles.title}>
          {phase === 'matched'
            ? 'Match found.\nReady to recreate?'
            : phase === 'unreadable'
              ? "Couldn't find ingredients.\nTry again?"
              : 'Scan a product’s\ningredients list.'}
        </Text>
        <Text style={styles.sub}>
          {phase === 'matched'
            ? 'We pulled a pure version from your library — same job, fewer ingredients.'
            : phase === 'unreadable'
              ? errorMsg ??
                'Try scanning the back label where ingredients are listed.'
              : 'Aim at the ingredients list on the back. We’ll read it and suggest a clean recreation.'}
        </Text>

        {phase === 'aim' || phase === 'detecting' ? (
          <View style={styles.guideHint}>
            <Ionicons name="information-circle-outline" size={13} color={PALETTE.amberDeep} />
            <Text style={styles.guideHintText}>
              Look for the section starting with “Ingredients:” or “Contains:”
            </Text>
          </View>
        ) : null}

        {/* Live camera viewfinder */}
        <View style={styles.viewfinderWrap}>
          <CameraView
            ref={cameraRef}
            style={styles.viewfinder}
            facing="back"
          />

          {/* Corner markers + scan line overlay */}
          <View style={styles.overlay} pointerEvents="none">
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            {phase !== 'matched' ? (
              <Animated.View
                style={[
                  styles.scanLine,
                  {
                    transform: [
                      {
                        translateY: scanY.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-110, 110],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <LinearGradient
                  colors={['#A8B8A000', '#A8B8A0FF', '#A8B8A000']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={StyleSheet.absoluteFillObject}
                />
              </Animated.View>
            ) : null}

            <View style={styles.statusPill}>
              <View
                style={[
                  styles.statusDot,
                  phase === 'detecting' && { backgroundColor: '#FFC76A' },
                  phase === 'matched' && { backgroundColor: PALETTE.sage },
                  phase === 'unreadable' && { backgroundColor: PALETTE.rose },
                ]}
              />
              <Text style={styles.statusText}>
                {phase === 'aim'
                  ? 'Looking for ingredients…'
                  : phase === 'detecting'
                    ? 'Reading ingredients…'
                    : phase === 'matched' && result
                      ? `Match · ${Math.round(result.match.confidence * 100)}%`
                      : 'Try again'}
              </Text>
            </View>
          </View>
        </View>

        {/* Match card */}
        {phase === 'matched' && result ? (
          <MatchCard result={result} onReset={reset} />
        ) : phase === 'unreadable' ? (
          <UnreadableCard onReset={reset} reason={errorMsg ?? undefined} />
        ) : (
          <View style={styles.shutterWrap}>
            <Pressable
              accessibilityLabel="Capture"
              onPress={startCapture}
              disabled={phase === 'detecting'}
              style={({ pressed }) => [
                styles.shutterOuter,
                phase === 'detecting' && { opacity: 0.6 },
                pressed && { transform: [{ scale: 0.94 }] },
              ]}
            >
              {phase === 'detecting' ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <View style={styles.shutterInner} />
              )}
            </Pressable>
            <Text style={styles.shutterHint}>
              {phase === 'detecting'
                ? 'Reading label with PureCraft AI…'
                : 'Tap to scan'}
            </Text>
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------- Match card -----------------------------------------------------

function MatchCard({
  result,
  onReset,
}: {
  result: Result;
  onReset: () => void;
}) {
  const tier = TIER_COPY[result.tier];
  const confidencePct = Math.round(result.match.confidence * 100);
  const recipe = result.match.recipe;
  const matched = result.match.matchedIngredients.length;
  const total = recipe.ingredients.length;

  return (
    <View style={styles.matchCard}>
      <View style={styles.matchHeader}>
        <View style={[styles.matchSwatch, { backgroundColor: PALETTE.sageSoft }]}>
          <Image
            source={recipeIcon(recipe.id, recipe.categoryKey)}
            testID="pc-recipe-icon"
            style={{ width: '78%', height: '78%' }}
            resizeMode="contain"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.matchTier, { color: tier.color }]}>
            {tier.label.toUpperCase()}
          </Text>
          <Text style={styles.matchName} numberOfLines={2}>
            {recipe.title}
          </Text>
          <Text style={styles.matchTierSub}>{tier.sub}</Text>
        </View>
        <View style={styles.matchScore}>
          <Text style={styles.matchScoreValue}>{confidencePct}%</Text>
          <Text style={styles.matchScoreLabel}>match</Text>
        </View>
      </View>

      <View style={styles.matchDivider} />

      {result.scan.brand || result.scan.product_name ? (
        <View style={styles.scannedBlock}>
          <Text style={styles.scannedEyebrow}>WE READ</Text>
          <Text style={styles.scannedName}>
            {result.scan.brand ? result.scan.brand + ' · ' : ''}
            {result.scan.product_name ?? '(unnamed product)'}
          </Text>
          {result.scan.ingredients.length > 0 ? (
            <Text style={styles.scannedIngredients} numberOfLines={2}>
              {result.scan.ingredients.slice(0, 8).join(' · ')}
              {result.scan.ingredients.length > 8 ? ' …' : ''}
            </Text>
          ) : null}
        </View>
      ) : null}

      <View style={styles.statsBar}>
        <View style={styles.statBlock}>
          <Text style={styles.statValue}>
            {matched}/{total}
          </Text>
          <Text style={styles.statLabel}>ingredients aligned</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBlock}>
          <Text style={styles.statValue}>{recipe.time}</Text>
          <Text style={styles.statLabel}>to make</Text>
        </View>
      </View>

      <View style={styles.matchActions}>
        <Pressable
          onPress={onReset}
          style={({ pressed }) => [
            styles.secondaryBtn,
            pressed && { opacity: 0.7 },
          ]}
        >
          <Ionicons name="refresh" size={14} color={PALETTE.text} />
          <Text style={styles.secondaryBtnText}>Scan another</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            tapSoft();
            router.push({ pathname: '/result', params: { id: recipe.id } });
          }}
          style={({ pressed }) => [
            styles.primaryBtn,
            pressed && { opacity: 0.92 },
          ]}
        >
          <Text style={styles.primaryBtnText}>Make this</Text>
          <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

// ---------- Unreadable fallback -------------------------------------------

/** Bespoke copy per failure mode. The Edge Function returns a short reason
 *  code (`no_ingredients_section`, `front_label_only`, `blurry`, `too_dark`,
 *  `no_label`) or a free-text reason. Map them to actionable guidance. */
function reasonCopy(reason?: string): { title: string; sub: string } {
  const r = (reason ?? '').toLowerCase();
  if (r.includes('no_ingredients_section') || r.includes('ingredients section')) {
    return {
      title: "Couldn't find ingredients",
      sub: 'Try scanning the back label where ingredients are listed.',
    };
  }
  if (r.includes('front_label') || r.includes('front of')) {
    return {
      title: 'Flip the product over',
      sub: 'Ingredients are usually printed on the back or side of the bottle.',
    };
  }
  if (r.includes('blurry')) {
    return {
      title: 'Image was a bit blurry',
      sub: 'Hold the camera steady and tap to focus on the ingredients list.',
    };
  }
  if (r.includes('too_dark') || r.includes('dark')) {
    return {
      title: 'Could use more light',
      sub: 'Move to a brighter spot or turn on a lamp, then try again.',
    };
  }
  if (r.includes('no_label') || r.includes('no label')) {
    return {
      title: "Didn't see a label",
      sub: 'Aim the camera squarely at the product label and try again.',
    };
  }
  return {
    title: "Couldn't find ingredients",
    sub: 'Try scanning the back label where ingredients are listed.',
  };
}

const FALLBACK_CATEGORIES: {
  key: 'cleaning' | 'beauty' | 'home' | 'laundry';
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  recipeId: string;
}[] = [
  { key: 'cleaning', label: 'Cleaning spray', icon: 'sparkles-outline', recipeId: 'kitchen-spray' },
  { key: 'beauty', label: 'Beauty / skincare', icon: 'flower-outline', recipeId: 'sugar-scrub' },
  { key: 'home', label: 'Home / scent', icon: 'leaf-outline', recipeId: 'room-spray' },
  { key: 'laundry', label: 'Laundry', icon: 'shirt-outline', recipeId: 'laundry-booster' },
];

function UnreadableCard({
  onReset,
  reason,
}: {
  onReset: () => void;
  reason?: string;
}) {
  // Map Claude's structured reason codes into actionable user copy. Falls
  // back to the generic message for free-text reasons or unknown values.
  const { title, sub } = reasonCopy(reason);
  return (
    <View style={styles.matchCard}>
      <View style={styles.unreadableHero}>
        <View style={styles.unreadableIcon}>
          <Ionicons name="alert-circle-outline" size={20} color={PALETTE.rose} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.unreadableTitle}>{title}</Text>
          <Text style={styles.unreadableSub}>{sub}</Text>
        </View>
      </View>

      <Text style={styles.scannedEyebrow}>BROWSE BY CATEGORY</Text>
      <View style={styles.fallbackGrid}>
        {FALLBACK_CATEGORIES.map((c) => (
          <Pressable
            key={c.key}
            onPress={() => {
              tapLight();
              router.push({ pathname: '/result', params: { id: c.recipeId } });
            }}
            style={({ pressed }) => [
              styles.fallbackCard,
              pressed && { transform: [{ scale: 0.98 }] },
            ]}
          >
            <View style={styles.fallbackIcon}>
              <Ionicons name={c.icon} size={18} color={PALETTE.sageDeep} />
            </View>
            <Text style={styles.fallbackLabel}>{c.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.matchActions}>
        <Pressable
          onPress={onReset}
          style={({ pressed }) => [
            styles.primaryBtn,
            pressed && { opacity: 0.92 },
          ]}
        >
          <Ionicons name="camera" size={14} color="#FFFFFF" />
          <Text style={styles.primaryBtnText}>Try scanning again</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---------- Styles ---------------------------------------------------------

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PALETTE.bg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 14,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: PALETTE.cream,
    borderWidth: 1,
    borderColor: PALETTE.creamDeep,
  },
  topPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: PALETTE.amberDeep,
    letterSpacing: 0.4,
  },

  scroll: { paddingHorizontal: 20, paddingBottom: 40 },

  eyebrow: {
    fontSize: 10.5,
    letterSpacing: 1.6,
    fontWeight: '700',
    color: PALETTE.amberDeep,
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '700',
    color: PALETTE.text,
    letterSpacing: -0.6,
  },
  sub: {
    fontSize: 13.5,
    lineHeight: 19,
    color: PALETTE.textWarm,
    marginTop: 8,
    marginBottom: 14,
  },
  guideHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: PALETTE.cream,
    borderWidth: 1,
    borderColor: PALETTE.creamDeep,
    alignSelf: 'flex-start',
    marginBottom: 18,
  },
  guideHintText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: PALETTE.amberDeep,
    letterSpacing: 0.1,
  },

  // -- Permission gate ---------------------------------------------------
  permWrap: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 40,
    alignItems: 'center',
  },
  permIcon: {
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: PALETTE.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  permTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: PALETTE.text,
    letterSpacing: -0.6,
    textAlign: 'center',
  },
  permSub: {
    fontSize: 13.5,
    lineHeight: 20,
    color: PALETTE.textWarm,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  permBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: PALETTE.sageDeep,
    shadowColor: PALETTE.sageDeep,
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  permBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  permHint: {
    marginTop: 18,
    fontSize: 12,
    color: PALETTE.textMuted,
    textAlign: 'center',
    paddingHorizontal: 16,
  },

  // -- Viewfinder --------------------------------------------------------
  viewfinderWrap: {
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#1A201B',
    shadowColor: '#1F1F1F',
    shadowOpacity: 0.18,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  viewfinder: { width: '100%', height: 320 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#FFFFFF',
  },
  cornerTL: {
    top: 28,
    left: 28,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 6,
  },
  cornerTR: {
    top: 28,
    right: 28,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 6,
  },
  cornerBL: {
    bottom: 28,
    left: 28,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 6,
  },
  cornerBR: {
    bottom: 28,
    right: 28,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 6,
  },
  scanLine: {
    position: 'absolute',
    left: 28,
    right: 28,
    height: 2,
    opacity: 0.85,
  },
  statusPill: {
    position: 'absolute',
    bottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#A8B8A0',
  },
  statusText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // -- Shutter -----------------------------------------------------------
  shutterWrap: { alignItems: 'center', marginTop: 22, gap: 10 },
  shutterOuter: {
    width: 76,
    height: 76,
    borderRadius: 999,
    borderWidth: 4,
    borderColor: PALETTE.sage,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: PALETTE.sageDeep,
  },
  shutterHint: {
    fontSize: 12.5,
    fontWeight: '600',
    color: PALETTE.textWarm,
    letterSpacing: 0.2,
  },

  // -- Match card --------------------------------------------------------
  matchCard: {
    marginTop: 22,
    padding: 18,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: PALETTE.borderSoft,
    shadowColor: '#1F1F1F',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  matchHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  matchSwatch: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  matchTier: {
    fontSize: 9.5,
    letterSpacing: 1.4,
    fontWeight: '700',
  },
  matchName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: PALETTE.text,
    marginTop: 2,
    letterSpacing: -0.2,
  },
  matchTierSub: {
    fontSize: 11.5,
    color: PALETTE.textWarm,
    marginTop: 2,
  },
  matchScore: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: PALETTE.sageSoft,
    alignItems: 'center',
  },
  matchScoreValue: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.sageDeep,
    letterSpacing: -0.3,
  },
  matchScoreLabel: {
    fontSize: 9,
    color: PALETTE.sageDeep,
    letterSpacing: 0.6,
    fontWeight: '600',
  },
  matchDivider: {
    height: 1,
    backgroundColor: PALETTE.borderSoft,
    marginVertical: 14,
  },

  scannedBlock: { marginBottom: 12 },
  scannedEyebrow: {
    fontSize: 10,
    letterSpacing: 1.4,
    fontWeight: '700',
    color: PALETTE.textMuted,
    marginBottom: 6,
  },
  scannedName: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.text,
    letterSpacing: -0.2,
  },
  scannedIngredients: {
    fontSize: 11.5,
    color: PALETTE.textWarm,
    marginTop: 4,
    lineHeight: 16,
  },

  statsBar: {
    flexDirection: 'row',
    backgroundColor: PALETTE.cream,
    borderRadius: 16,
    padding: 14,
    marginTop: 4,
    borderWidth: 1,
    borderColor: PALETTE.creamDeep,
  },
  statBlock: { flex: 1, alignItems: 'center' },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.text,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 10.5,
    color: PALETTE.textWarm,
    marginTop: 2,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: PALETTE.creamDeep,
    marginHorizontal: 12,
  },

  matchActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  secondaryBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: PALETTE.text,
    letterSpacing: 0.3,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: PALETTE.sageDeep,
  },
  primaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // -- Unreadable fallback ----------------------------------------------
  unreadableHero: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  unreadableIcon: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: '#FBEFEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadableTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: PALETTE.text,
    letterSpacing: -0.2,
  },
  unreadableSub: {
    fontSize: 12.5,
    color: PALETTE.textWarm,
    marginTop: 4,
    lineHeight: 17,
  },
  fallbackGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  fallbackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '48%',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: PALETTE.sageSoft,
  },
  fallbackIcon: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackLabel: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
    color: PALETTE.text,
  },
});
