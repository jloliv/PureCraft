import { router } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingHeader } from '@/components/onboarding-header';
import { tapLight } from '@/lib/haptics';
import { INTENT_IMAGE_FALLBACK, INTENT_IMAGES } from '@/lib/intent-images';
import { patchOnboardingAnswers, useOnboardingAnswers } from '@/lib/onboarding-answers';

const PALETTE = {
  bg: '#FFFFFF',
  text: '#1A1A1A',
  textMuted: '#6F6F6F',
  surfaceWarm: 'rgba(255,255,255,0.5)',
  border: '#E8E3D9',
  sageDeep: '#5F876A',
  sageSoft: '#E8F0EA',
};

const MAX_SELECTION = 3;

type IntentOption = { key: string; label: string };

const INTENTS: IntentOption[] = [
  { key: 'safer-cleaning', label: 'Safer Cleaning' },
  { key: 'better-skin-care', label: 'Better Skin Care' },
  { key: 'luxury-home-scents', label: 'Luxury Home Scents' },
  { key: 'save-money', label: 'Save Money' },
  { key: 'allergy-friendly', label: 'Allergy Friendly' },
  { key: 'eco-living', label: 'Eco Living' },
  { key: 'diy-beauty', label: 'DIY Beauty' },
  { key: 'wellness-routines', label: 'Wellness Routines' },
  // Power-user / creator intent for Build / Save / Pantry tools.
  { key: 'create-recipes', label: 'Create & Save Recipes' },
];

export default function Intent() {
  // Seed from previously-saved answers so re-entering the screen from
  // Settings shows the user's existing picks instead of an empty state.
  const savedAnswers = useOnboardingAnswers();
  const [selected, setSelected] = useState<string[]>(
    () => savedAnswers.intent_categories ?? [],
  );
  const { width: screenWidth } = useWindowDimensions();
  const columns = screenWidth < 380 ? 2 : 3;
  const cardBasis = columns === 2 ? '47%' : '30%';

  const handleSelect = (key: string) => {
    tapLight();
    setSelected((prev) => {
      if (prev.includes(key)) {
        return prev.filter((item) => item !== key);
      }

      if (prev.length < MAX_SELECTION) {
        return [...prev, key];
      }

      return prev;
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <OnboardingHeader step={1} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>Step 1</Text>
        <Text style={styles.title}>What would you like help with?</Text>
        <Text style={styles.subtitle}>
          Pick what matters most — we&apos;ll tailor everything to you.
        </Text>

        <View style={styles.grid}>
          {INTENTS.map((it) => {
            const isSelected = selected.includes(it.key);
            const imageSource = INTENT_IMAGES[it.key] ?? INTENT_IMAGE_FALLBACK;
            return (
              <TouchableOpacity
                key={it.key}
                activeOpacity={0.92}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={it.label}
                onPress={() => handleSelect(it.key)}
                style={[styles.card, { flexBasis: cardBasis }, isSelected && styles.selectedCard]}
              >
                <View style={styles.imageWrapper}>
                  <Image source={imageSource} style={styles.image} resizeMode="cover" />
                </View>
                <Text style={styles.label} numberOfLines={2}>
                  {it.label}
                </Text>
                {isSelected ? (
                  <View style={styles.check}>
                    <View style={styles.checkMark} />
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityState={{ disabled: selected.length === 0 }}
          disabled={selected.length === 0}
          style={[styles.button, selected.length === 0 && styles.buttonDisabled]}
          onPress={() => {
            void patchOnboardingAnswers({ intent_categories: selected });
            router.push('/onboarding/avoidances');
          }}
        >
          <Text style={styles.buttonText}>
            {selected.length > 0 ? 'Continue' : 'Pick at least one'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PALETTE.bg },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 0,
    backgroundColor: PALETTE.bg,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 2.4,
    fontWeight: '600',
    color: PALETTE.sageDeep,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 26,
    fontWeight: '600',
    letterSpacing: -0.5,
    color: PALETTE.text,
    marginTop: 10,
  },
  subtitle: {
    fontSize: 15,
    color: PALETTE.textMuted,
    lineHeight: 22,
    marginTop: 6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  card: {
    marginBottom: 20,
    alignItems: 'center',
    position: 'relative',
  },
  selectedCard: {
    backgroundColor: '#FFFFFF',
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E6DFD2',
    backgroundColor: '#F2EDE3',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  label: {
    marginTop: 12,
    color: '#2F4F3E',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  check: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: PALETTE.sageDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    width: 6,
    height: 10,
    borderBottomWidth: 1.6,
    borderRightWidth: 1.6,
    borderColor: '#FFFFFF',
    transform: [{ rotate: '45deg' }, { translateY: -1 }],
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 0,
    backgroundColor: PALETTE.bg,
  },
  button: {
    backgroundColor: PALETTE.sageDeep,
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
