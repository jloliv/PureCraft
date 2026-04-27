import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { tapLight, tapMedium, tapSoft, success } from '@/lib/haptics';

const PALETTE = {
  bg: '#F8F6F1',
  text: '#1F1F1F',
  textMuted: '#6F6A60',
  textSubtle: '#A8A398',
  surface: '#FFFFFF',
  border: '#E8E2D2',
  sage: '#A8B8A0',
  sageDeep: '#7E8F75',
  sageSoft: '#E4EDE5',
  cream: '#F7F2E7',
  creamDeep: '#EFE7D2',
  amber: '#9C7A4F',
  amberDeep: '#7C5C2E',
};

type Phase = 'aim' | 'detecting' | 'matched';

const RECENT = [
  { brand: 'Method', name: 'All-purpose Spray', emoji: '🧴', match: 'kitchen-spray' },
  { brand: 'Mrs. Meyer’s', name: 'Lemon Multi-surface', emoji: '🍋', match: 'kitchen-spray' },
  { brand: 'Aesop', name: 'Resurrection Hand Wash', emoji: '🌿', match: 'body-butter' },
];

export default function Scan() {
  const [phase, setPhase] = useState<Phase>('aim');
  const scanY = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (phase === 'aim' || phase === 'detecting') {
      Animated.loop(
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
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.05, duration: 1100, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0.85, duration: 1100, useNativeDriver: true }),
        ]),
      ).start();
    }
  }, [phase, scanY, pulse]);

  const startCapture = () => {
    tapMedium();
    setPhase('detecting');
    setTimeout(() => {
      success();
      setPhase('matched');
    }, 1800);
  };

  const reset = () => {
    tapLight();
    setPhase('aim');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Flash"
          onPress={tapLight}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="flash-outline" size={18} color={PALETTE.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>SCAN</Text>
        <Text style={styles.title}>
          {phase === 'matched'
            ? 'Match found.\nReady to recreate?'
            : 'Aim at any product’s label.'}
        </Text>
        <Text style={styles.sub}>
          {phase === 'matched'
            ? 'We pulled a pure version from your library — same job, fewer ingredients.'
            : 'PureCraft reads the brand, ingredients, and category, then suggests a clean recreation.'}
        </Text>

        <View style={styles.viewfinderWrap}>
          <LinearGradient
            colors={['#1F2421', '#2A332B', '#1A201B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.viewfinder}
          >
            <Animated.View style={[styles.bottle, { transform: [{ scale: pulse }] }]}>
              <Text style={styles.bottleEmoji}>🧴</Text>
            </Animated.View>

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
                ]}
              />
              <Text style={styles.statusText}>
                {phase === 'aim'
                  ? 'Looking for label\u2026'
                  : phase === 'detecting'
                    ? 'Reading ingredients\u2026'
                    : 'Match · 96% confidence'}
              </Text>
            </View>
          </LinearGradient>
        </View>

        {phase === 'matched' ? (
          <View style={styles.matchCard}>
            <View style={styles.matchHeader}>
              <Text style={styles.matchEmoji}>🍋</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.matchBrand}>METHOD</Text>
                <Text style={styles.matchName}>Lemon Multi-surface Spray</Text>
              </View>
              <View style={styles.matchScore}>
                <Text style={styles.matchScoreValue}>96%</Text>
                <Text style={styles.matchScoreLabel}>match</Text>
              </View>
            </View>
            <View style={styles.matchDivider} />
            <Text style={styles.matchSub}>Closest pure version in your library</Text>
            <View style={styles.matchProduct}>
              <View style={styles.matchSwatch}>
                <Text style={{ fontSize: 32 }}>🍋</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.matchProductTitle}>Citrus Kitchen Degreaser</Text>
                <Text style={styles.matchProductMeta}>5 ingredients · 4 min · 1 bottle saved</Text>
              </View>
            </View>
            <View style={styles.matchActions}>
              <Pressable
                onPress={reset}
                style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.7 }]}
              >
                <Ionicons name="refresh" size={14} color={PALETTE.text} />
                <Text style={styles.secondaryBtnText}>Scan another</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  tapSoft();
                  router.push({ pathname: '/result', params: { id: 'kitchen-spray' } });
                }}
                style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.92 }]}
              >
                <Text style={styles.primaryBtnText}>Make this</Text>
                <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
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
              <View style={styles.shutterInner} />
            </Pressable>
          </View>
        )}

        <Text style={styles.recentEyebrow}>RECENTLY SCANNED</Text>
        <View style={styles.recentList}>
          {RECENT.map((r, i) => (
            <Pressable
              key={r.brand + r.name}
              onPress={() => {
                tapLight();
                router.push({ pathname: '/result', params: { id: r.match } });
              }}
              style={({ pressed }) => [
                styles.recentRow,
                i === 0 && { borderTopWidth: 0 },
                pressed && { backgroundColor: PALETTE.surface },
              ]}
            >
              <View style={styles.recentSwatch}>
                <Text style={{ fontSize: 18 }}>{r.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.recentBrand}>{r.brand.toUpperCase()}</Text>
                <Text style={styles.recentName}>{r.name}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={PALETTE.textSubtle} />
            </Pressable>
          ))}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PALETTE.bg },
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
  topPillText: { fontSize: 11.5, fontWeight: '700', color: PALETTE.amberDeep, letterSpacing: 0.4 },
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
    color: PALETTE.textMuted,
    marginTop: 8,
    marginBottom: 22,
  },

  viewfinderWrap: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#1F1F1F',
    shadowOpacity: 0.18,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  viewfinder: {
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bottle: {
    width: 130,
    height: 200,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottleEmoji: { fontSize: 80, opacity: 0.85 },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#FFFFFF',
  },
  cornerTL: { top: 28, left: 28, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 6 },
  cornerTR: { top: 28, right: 28, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 6 },
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
  statusText: { fontSize: 11.5, fontWeight: '600', color: '#FFFFFF', letterSpacing: 0.3 },

  shutterWrap: { alignItems: 'center', marginTop: 22 },
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

  matchCard: {
    marginTop: 22,
    padding: 18,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#1F1F1F',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  matchHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  matchEmoji: { fontSize: 30 },
  matchBrand: {
    fontSize: 10,
    letterSpacing: 1.4,
    fontWeight: '700',
    color: PALETTE.amberDeep,
  },
  matchName: { fontSize: 14.5, fontWeight: '700', color: PALETTE.text, marginTop: 2 },
  matchScore: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: PALETTE.sageSoft,
    alignItems: 'center',
  },
  matchScoreValue: { fontSize: 14, fontWeight: '700', color: PALETTE.sageDeep, letterSpacing: -0.3 },
  matchScoreLabel: { fontSize: 9, color: PALETTE.sageDeep, letterSpacing: 0.6, fontWeight: '600' },
  matchDivider: { height: 1, backgroundColor: PALETTE.border, marginVertical: 14 },
  matchSub: {
    fontSize: 10.5,
    letterSpacing: 1.2,
    fontWeight: '700',
    color: PALETTE.textMuted,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  matchProduct: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 18,
    backgroundColor: PALETTE.cream,
    borderWidth: 1,
    borderColor: PALETTE.creamDeep,
  },
  matchSwatch: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchProductTitle: { fontSize: 14, fontWeight: '700', color: PALETTE.text },
  matchProductMeta: { fontSize: 11.5, color: PALETTE.textMuted, marginTop: 2 },
  matchActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
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
  secondaryBtnText: { fontSize: 12.5, fontWeight: '700', color: PALETTE.text, letterSpacing: 0.3 },
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
  primaryBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.3 },

  recentEyebrow: {
    fontSize: 10.5,
    letterSpacing: 1.6,
    fontWeight: '700',
    color: PALETTE.textMuted,
    marginTop: 28,
    marginBottom: 10,
    marginLeft: 4,
  },
  recentList: {
    backgroundColor: PALETTE.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: PALETTE.border,
    overflow: 'hidden',
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
  },
  recentSwatch: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: PALETTE.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentBrand: { fontSize: 9.5, letterSpacing: 1.2, fontWeight: '700', color: PALETTE.amberDeep },
  recentName: { fontSize: 13.5, fontWeight: '600', color: PALETTE.text, marginTop: 1 },
});
