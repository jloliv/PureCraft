import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';

const PALETTE = {
  bg: '#F8F6F1',
  text: '#1F1F1F',
  textMuted: '#6F6A60',
  textSubtle: '#A8A398',
  surface: '#FFFFFF',
  surfaceWarm: '#F1ECE0',
  border: '#E8E2D2',
  sage: '#A8B8A0',
  sageDeep: '#7E8F75',
  sageSoft: '#E4EDE5',
  cream: '#F7F2E7',
  creamDeep: '#EFE7D2',
  gold: '#C7A96B',
  goldDeep: '#A98A4D',
};

const PRIORITIES_FOR_YOU = [
  { icon: 'leaf-outline' as const, title: 'Low-scent formulas', body: 'Light or unscented across cleaning + beauty.' },
  { icon: 'flower-outline' as const, title: 'Sensitive-skin beauty', body: 'Gentler ratios, oat & honey first.' },
  { icon: 'paw-outline' as const, title: 'Pet-safe home care', body: 'Eucalyptus and tea tree filtered out.' },
  { icon: 'time-outline' as const, title: 'Quick budget recipes', body: '10 min average · pantry-priced.' },
];

const NEXT_UP = [
  { emoji: '🛁', title: 'Gentle Bathroom Spray', tag: 'Family-safe · 4 min' },
  { emoji: '🌿', title: 'Lavender Linen Mist', tag: 'Calming · 5 min' },
  { emoji: '🍯', title: 'Honey Sugar Scrub', tag: 'Beauty ritual · 6 min' },
];

export default function Results() {
  const fade = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(lift, { toValue: 0, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [fade, lift]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fade, transform: [{ translateY: lift }] }}>
          <LinearGradient
            colors={['#F1ECE0', '#F7F2E7', '#E4EDE5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroBadge}>
              <Ionicons name="checkmark-circle" size={14} color={PALETTE.sageDeep} />
              <Text style={styles.heroBadgeText}>Profile ready</Text>
            </View>
            <Text style={styles.heroEyebrow}>Welcome to your</Text>
            <Text style={styles.heroTitle}>Custom PureCraft{`\n`}Experience</Text>
            <Text style={styles.heroSub}>
              Every recipe, ingredient, and ritual will now be tuned to you.
            </Text>
          </LinearGradient>

          <Text style={styles.section}>We&apos;ll prioritize</Text>
          <View style={styles.list}>
            {PRIORITIES_FOR_YOU.map((p, i) => (
              <View
                key={p.title}
                style={[styles.row, i === 0 && { borderTopWidth: 0 }]}
              >
                <View style={styles.iconWrap}>
                  <Ionicons name={p.icon} size={18} color={PALETTE.sageDeep} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{p.title}</Text>
                  <Text style={styles.rowBody}>{p.body}</Text>
                </View>
                <View style={styles.checkPill}>
                  <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                </View>
              </View>
            ))}
          </View>

          <Text style={styles.section}>First in your feed</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardRow}
          >
            {NEXT_UP.map((n) => (
              <View key={n.title} style={styles.nextCard}>
                <View style={styles.nextSwatch}>
                  <Text style={styles.nextEmoji}>{n.emoji}</Text>
                </View>
                <Text style={styles.nextTitle} numberOfLines={2}>{n.title}</Text>
                <Text style={styles.nextTag}>{n.tag}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.upgrade}>
            <View style={styles.upgradeRow}>
              <View style={styles.upgradeBadge}>
                <Ionicons name="sparkles" size={12} color={PALETTE.goldDeep} />
                <Text style={styles.upgradeBadgeText}>PureCraft+</Text>
              </View>
              <Text style={styles.upgradeMeta}>7-day trial</Text>
            </View>
            <Text style={styles.upgradeTitle}>Want all 120+ premium recipes too?</Text>
            <Text style={styles.upgradeSub}>
              Allergy-aware filters, family profiles, smart shopping planner.
            </Text>
          </View>
        </Animated.View>

        <View style={{ height: 24 }} />
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label="Enter PureCraft"
          trailingIcon="arrow-forward"
          onPress={() => router.replace('/')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PALETTE.bg },
  scroll: { paddingHorizontal: 22, paddingBottom: 16 },

  heroCard: {
    marginTop: 12,
    padding: 24,
    borderRadius: 26,
    shadowColor: '#1F1F1F',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#FFFFFFCC',
  },
  heroBadgeText: {
    fontSize: 11,
    letterSpacing: 0.6,
    fontWeight: '700',
    color: PALETTE.sageDeep,
  },
  heroEyebrow: {
    fontSize: 13,
    color: PALETTE.textMuted,
    marginTop: 18,
    fontStyle: 'italic',
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '700',
    color: PALETTE.text,
    letterSpacing: -0.6,
    marginTop: 4,
  },
  heroSub: {
    fontSize: 14,
    lineHeight: 20,
    color: PALETTE.textMuted,
    marginTop: 10,
  },

  section: {
    marginTop: 28,
    marginBottom: 12,
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.text,
    letterSpacing: -0.3,
  },
  list: {
    backgroundColor: PALETTE.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: PALETTE.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: PALETTE.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { fontSize: 14.5, fontWeight: '700', color: PALETTE.text, letterSpacing: -0.2 },
  rowBody: { fontSize: 12.5, color: PALETTE.textMuted, marginTop: 2, lineHeight: 17 },
  checkPill: {
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: PALETTE.sageDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardRow: { gap: 12, paddingRight: 12 },
  nextCard: {
    width: 160,
    paddingBottom: 4,
    gap: 8,
  },
  nextSwatch: {
    height: 130,
    borderRadius: 18,
    backgroundColor: PALETTE.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  nextEmoji: { fontSize: 40 },
  nextTitle: { fontSize: 13.5, fontWeight: '700', color: PALETTE.text, lineHeight: 17 },
  nextTag: { fontSize: 11.5, color: PALETTE.textMuted },

  upgrade: {
    marginTop: 28,
    padding: 18,
    borderRadius: 20,
    backgroundColor: PALETTE.cream,
    borderWidth: 1,
    borderColor: PALETTE.creamDeep,
    gap: 4,
  },
  upgradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  upgradeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: PALETTE.creamDeep,
  },
  upgradeBadgeText: { fontSize: 10, letterSpacing: 0.8, fontWeight: '700', color: PALETTE.goldDeep },
  upgradeMeta: { fontSize: 11.5, fontWeight: '600', color: PALETTE.textMuted },
  upgradeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.text,
    marginTop: 8,
    letterSpacing: -0.2,
  },
  upgradeSub: { fontSize: 12.5, color: PALETTE.textMuted, lineHeight: 17, marginTop: 4 },

  footer: {
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
    backgroundColor: PALETTE.bg,
  },
});
