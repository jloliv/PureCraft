import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingHeader } from '@/components/onboarding-header';
import { BACKGROUND_PRIMARY } from '@/constants/theme';
import { tapLight } from '@/lib/haptics';
import { patchOnboardingAnswers } from '@/lib/onboarding-answers';

const PALETTE = {
  bg: BACKGROUND_PRIMARY,
  text: '#1F1F1F',
  textMuted: '#6B6B6B',
  textSubtle: '#7A8A7A',
  border: 'rgba(0,0,0,0.05)',
  indicatorBorder: '#CFC9BE',
  sageDeep: '#5F876A',
  sageSoft: 'rgba(95, 135, 106, 0.04)',
};

type Concern = { key: string; label: string; hint: string };

const CONCERNS: Concern[] = [
  { key: 'sensitive', label: 'Sensitive Skin', hint: 'Reacts easily' },
  { key: 'dry', label: 'Dry Skin', hint: 'Tight, flaky' },
  { key: 'oily', label: 'Oily Skin', hint: 'Shine + breakouts' },
  { key: 'acne', label: 'Acne Prone', hint: 'Breakouts often' },
  { key: 'eczema', label: 'Eczema Prone', hint: 'Redness + dry patches' },
  { key: 'mature', label: 'Mature Skin', hint: 'Lines + radiance' },
  { key: 'scalp', label: 'Scalp Issues', hint: 'Itch + flake' },
];

function ConcernRow({
  concern,
  selected,
  isLast,
  onPress,
}: {
  concern: Concern;
  selected: boolean;
  isLast?: boolean;
  onPress: () => void;
}) {
  const fade = useRef(new Animated.Value(selected ? 1 : 0)).current;
  const textOpacity = useRef(new Animated.Value(selected ? 1 : 0.85)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: selected ? 1 : 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(textOpacity, {
        toValue: selected ? 1 : 0.85,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, selected, textOpacity]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.99,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View
      style={[
        styles.rowFrame,
        !isLast && styles.rowDivider,
        { transform: [{ scale }] },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityLabel={concern.label}
        onPress={handlePress}
        style={({ pressed }) => [
          styles.row,
          selected && styles.rowSelected,
          pressed && styles.rowPressed,
        ]}
      >
        <Animated.View style={[styles.rowTextWrap, { opacity: textOpacity }]}>
          <Text style={[styles.rowLabel, selected && styles.rowLabelSelected]}>
            {concern.label}
          </Text>
          <Text style={styles.rowHint}>{concern.hint}</Text>
        </Animated.View>
        <View style={[styles.indicator, selected && styles.indicatorSelected]}>
          <Animated.View style={{ opacity: fade }}>
            <Ionicons name="checkmark" size={14} color="#FFFFFF" />
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function Skin() {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (key: string) => {
    tapLight();
    setSelected((prev) => {
      return prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key];
    });
  };

  const saveAndContinue = () => {
    void patchOnboardingAnswers({ skin_profile: { concerns: selected } });
    router.push('/onboarding/scent');
  };

  const hasSelections = selected.length > 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <OnboardingHeader step={3} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>Step 3</Text>
        <Text style={styles.headline}>How does your{`\n`}skin behave?</Text>
        <Text style={styles.sub}>
          Beauty recipes get tailored ingredients, gentler ratios, and smarter swaps.
        </Text>
        <Text style={styles.instruction}>Select all that apply.</Text>

        <View style={styles.list}>
          {CONCERNS.map((concern, index) => (
            <ConcernRow
              key={concern.key}
              concern={concern}
              selected={selected.includes(concern.key)}
              isLast={index === CONCERNS.length - 1}
              onPress={() => toggle(concern.key)}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          onPress={saveAndContinue}
          style={({ pressed }) => [styles.cta, pressed && { transform: [{ scale: 0.99 }] }]}
        >
          <Text style={styles.ctaText}>{hasSelections ? 'Continue' : 'Skip for now'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PALETTE.bg },
  scroll: { paddingHorizontal: 22, paddingBottom: 32, backgroundColor: PALETTE.bg },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 2.4,
    fontWeight: '600',
    color: PALETTE.textSubtle,
    textTransform: 'uppercase',
  },
  headline: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '700',
    color: PALETTE.text,
    letterSpacing: -0.6,
    marginTop: 8,
  },
  sub: {
    fontSize: 14,
    lineHeight: 20,
    color: PALETTE.textMuted,
    marginTop: 10,
  },
  instruction: {
    fontSize: 13,
    color: PALETTE.textMuted,
    marginTop: 8,
  },
  list: { marginTop: 34 },
  rowFrame: {
    overflow: 'hidden',
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.border,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 18,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  rowSelected: {
    backgroundColor: PALETTE.sageSoft,
  },
  rowPressed: {
    backgroundColor: PALETTE.sageSoft,
  },
  rowTextWrap: {
    flex: 1,
    paddingRight: 16,
  },
  rowLabel: { fontSize: 16, fontWeight: '500', color: PALETTE.text },
  rowLabelSelected: { color: '#101510' },
  rowHint: { fontSize: 13, color: PALETTE.textMuted, marginTop: 2 },
  indicator: {
    width: 22,
    height: 22,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: PALETTE.indicatorBorder,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorSelected: { backgroundColor: PALETTE.sageDeep, borderColor: PALETTE.sageDeep },

  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    backgroundColor: PALETTE.bg,
    alignItems: 'center',
  },
  cta: {
    width: '90%',
    height: 56,
    borderRadius: 18,
    backgroundColor: PALETTE.sageDeep,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
