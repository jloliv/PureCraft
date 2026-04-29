// Freemium gate modal — the soft "you're on a roll" / hard "go unlimited"
// upsell that fires from scan, save, recipe lock, and pantry-scan flows.
//
// Copy follows the freemium spec: never "limit reached", always "go
// unlimited" / "keep going" framing. Visual is calm and minimal — same
// palette as the rest of the app, generous whitespace, never loud.

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useEffect, useRef } from 'react';

import { tapLight, tapMedium } from '@/lib/haptics';

const PALETTE = {
  bg: '#F8F6F1',
  text: '#111111',
  textWarm: '#6F6A60',
  textMuted: '#8A8377',
  surface: '#FFFFFF',
  border: '#E9E4DA',
  borderSoft: '#F0EADA',
  sage: '#A8B8A0',
  sageDeep: '#7E8F75',
  sageSoft: '#E4EDE5',
  cream: '#F7F2E7',
  creamDeep: '#EFE7D2',
  gold: '#C7A96B',
  goldDeep: '#A98A4D',
};

export type FreemiumKind =
  | 'scan-soft'
  | 'scan-hard'
  | 'save'
  | 'recipe-lock'
  | 'pantry-preview';

export type FreemiumModalProps = {
  visible: boolean;
  kind: FreemiumKind;
  onClose: () => void;
  /** Only shown for `scan-soft`. Caller grants 1 bonus scan and dismisses. */
  onUseBonusScan?: () => void;
};

type CopyBlock = {
  eyebrow: string;
  title: string;
  message: string;
  primary: string;
  secondary?: string;
  benefits?: string[];
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
  accentSoft: string;
};

const COPY: Record<FreemiumKind, CopyBlock> = {
  'scan-soft': {
    eyebrow: 'PURECRAFT+',
    title: "You're on a roll",
    message:
      'Keep scanning and discovering cleaner alternatives without limits.',
    primary: 'Go Unlimited',
    secondary: 'Use 1 extra scan',
    icon: 'sparkles',
    accent: '#7E8F75',
    accentSoft: '#E4EDE5',
  },
  'scan-hard': {
    eyebrow: 'PURECRAFT+',
    title: 'Daily scan limit reached',
    message:
      'Upgrade to PureCraft+ for unlimited scans and smarter results.',
    primary: 'Go Unlimited',
    benefits: [
      'Unlimited scans',
      'Pantry scan to auto-add ingredients',
      'All 120+ premium recipes',
      'Save everything',
    ],
    icon: 'scan',
    accent: '#7E8F75',
    accentSoft: '#E4EDE5',
  },
  save: {
    eyebrow: 'PURECRAFT+',
    title: 'Save more of what you love',
    message:
      "You've reached your limit. Keep all your recipes in one place with PureCraft+.",
    primary: 'Unlock Unlimited Saves',
    benefits: [
      'Unlimited saves',
      'Folders + collections',
      'Cross-device sync',
      'All 120+ premium recipes',
    ],
    icon: 'bookmark',
    accent: '#A98A4D',
    accentSoft: '#F7F2E7',
  },
  'recipe-lock': {
    eyebrow: 'PURECRAFT+',
    title: 'Unlock the full library',
    message:
      'Get access to all recipes, including exclusive formulas you won’t find anywhere else.',
    primary: 'Go Unlimited',
    benefits: [
      'All 120+ recipes',
      'Seasonal recipe packs',
      'Premium beauty + deep cleaning',
      'Family household profiles',
    ],
    icon: 'lock-open-outline',
    accent: '#7E8F75',
    accentSoft: '#E4EDE5',
  },
  'pantry-preview': {
    eyebrow: 'PURECRAFT+',
    title: 'Scan your pantry in seconds',
    message: 'Add ingredients instantly instead of typing.',
    primary: 'Continue',
    icon: 'leaf',
    accent: '#7E8F75',
    accentSoft: '#E4EDE5',
  },
};

export function FreemiumModal({
  visible,
  kind,
  onClose,
  onUseBonusScan,
}: FreemiumModalProps) {
  const copy = COPY[kind];
  const fade = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fade, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(lift, {
          toValue: 0,
          damping: 22,
          stiffness: 240,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fade.setValue(0);
      lift.setValue(40);
    }
  }, [visible, fade, lift]);

  const onPrimary = () => {
    tapMedium();
    onClose();
    if (kind === 'pantry-preview') {
      // Preview path → still routes to paywall on Continue.
      router.push('/premium');
    } else {
      router.push('/premium');
    }
  };

  const onSecondary = () => {
    tapLight();
    if (kind === 'scan-soft' && onUseBonusScan) {
      onUseBonusScan();
    } else {
      onClose();
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onClose}
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View
        style={[styles.backdrop, { opacity: fade }]}
        pointerEvents={visible ? 'auto' : 'none'}
      >
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
      </Animated.View>

      <View style={styles.center} pointerEvents={visible ? 'box-none' : 'none'}>
        <Animated.View
          style={[
            styles.card,
            {
              opacity: fade,
              transform: [{ translateY: lift }],
            },
          ]}
        >
          <View style={[styles.iconWrap, { backgroundColor: copy.accentSoft }]}>
            <Ionicons name={copy.icon} size={22} color={copy.accent} />
          </View>

          <Text style={[styles.eyebrow, { color: copy.accent }]}>
            {copy.eyebrow}
          </Text>
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.message}>{copy.message}</Text>

          {copy.benefits ? (
            <View style={styles.benefits}>
              {copy.benefits.map((b) => (
                <View key={b} style={styles.benefitRow}>
                  <View style={[styles.benefitDot, { backgroundColor: copy.accent }]}>
                    <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                  </View>
                  <Text style={styles.benefitText}>{b}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <Pressable
            onPress={onPrimary}
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && { transform: [{ scale: 0.98 }] },
            ]}
          >
            <LinearGradient
              colors={['#A8B8A0', '#7E8F75', '#5C7F6B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryGradient}
            >
              <Text style={styles.primaryText}>{copy.primary}</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </LinearGradient>
          </Pressable>

          {copy.secondary ? (
            <Pressable
              onPress={onSecondary}
              style={({ pressed }) => [
                styles.secondaryBtn,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={styles.secondaryText}>{copy.secondary}</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={onClose}
              hitSlop={8}
              style={({ pressed }) => [
                styles.dismissBtn,
                pressed && { opacity: 0.6 },
              ]}
            >
              <Text style={styles.dismissText}>Maybe later</Text>
            </Pressable>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,18,16,0.55)',
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  card: {
    backgroundColor: PALETTE.surface,
    borderRadius: 28,
    padding: 28,
    borderWidth: 1,
    borderColor: PALETTE.borderSoft,
    shadowColor: '#1F1F1F',
    shadowOpacity: 0.2,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8,
    alignItems: 'center',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  eyebrow: {
    fontSize: 10.5,
    letterSpacing: 1.8,
    fontWeight: '700',
  },
  title: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '800',
    color: PALETTE.text,
    letterSpacing: -0.5,
    textAlign: 'center',
    marginTop: 6,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: PALETTE.textWarm,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 18,
    paddingHorizontal: 4,
  },
  benefits: {
    width: '100%',
    gap: 10,
    marginBottom: 18,
    paddingHorizontal: 4,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  benefitDot: {
    width: 18,
    height: 18,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: {
    fontSize: 13,
    color: PALETTE.text,
    fontWeight: '500',
    flex: 1,
  },
  primaryBtn: {
    width: '100%',
    borderRadius: 999,
    overflow: 'hidden',
    shadowColor: PALETTE.sageDeep,
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  primaryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingVertical: 15,
  },
  primaryText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  secondaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.sageDeep,
    letterSpacing: 0.2,
  },
  dismissBtn: {
    marginTop: 14,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  dismissText: {
    fontSize: 12.5,
    color: PALETTE.textMuted,
    fontWeight: '500',
  },
});
