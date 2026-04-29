import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  type ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingHeader } from '@/components/onboarding-header';
import { PrimaryButton } from '@/components/primary-button';
import { BACKGROUND_PRIMARY } from '@/constants/theme';
import { patchOnboardingAnswers } from '@/lib/onboarding-answers';

const PALETTE = {
  bg: BACKGROUND_PRIMARY,
  text: '#1F1F1F',
  textMuted: '#6B6B6B',
  surface: 'rgba(255,255,255,0.5)',
  surfaceWarm: 'rgba(255,255,255,0.5)',
  border: 'rgba(0,0,0,0.06)',
  sage: '#A8B8A0',
  sageDeep: '#5F876A',
  sageSoft: '#E4EDE5',
  cream: 'rgba(255,255,255,0.5)',
  creamDeep: 'rgba(0,0,0,0.06)',
};

type Member = {
  key: string;
  label: string;
  hint: string;
  icon: ImageSourcePropType;
};

// No dedicated babies asset yet — fall back to the young-children icon so the
// littlest tier still reads as a child. Swap in a custom
// `user-babies-icon.png` if/when art lands.
const MEMBERS: Member[] = [
  {
    key: 'baby',
    label: 'Babies',
    hint: '0 – 2',
    icon: require('../../assets/images/user-youngChildren-icon.png'),
  },
  {
    key: 'young',
    label: 'Young Children',
    hint: '3 – 7',
    icon: require('../../assets/images/user-youngChildren-icon.png'),
  },
  {
    key: 'older',
    label: 'Older Children',
    hint: '8 – 12',
    icon: require('../../assets/images/user-olderChildren-icon.png'),
  },
  {
    key: 'teens',
    label: 'Teens',
    hint: '13 – 17',
    icon: require('../../assets/images/user-teens-icon.png'),
  },
  {
    key: 'pets',
    label: 'Pets',
    hint: 'Cats, dogs & more',
    icon: require('../../assets/images/user-pets-icon.png'),
  },
  {
    key: 'adults',
    label: 'Adults Only',
    hint: 'No little ones',
    icon: require('../../assets/images/user-adultOnly-icon.png'),
  },
  {
    key: 'elderly',
    label: 'Elderly Family',
    hint: 'Sensitive support',
    icon: require('../../assets/images/user-elderly-icon.png'),
  },
];

export default function Household() {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (key: string) =>
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <OnboardingHeader step={5} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>Step 5</Text>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.82}
          style={styles.headline}
        >
          Who shares your home?
        </Text>
        <Text style={styles.sub}>
          We&apos;ll keep every formula safe for everyone under your roof.
        </Text>

        <View style={styles.grid}>
          {MEMBERS.map((m) => {
            const isSelected = selected.includes(m.key);
            return (
              <Pressable
                key={m.key}
                onPress={() => toggle(m.key)}
                style={({ pressed }) => [
                  styles.card,
                  isSelected && styles.cardSelected,
                  pressed && { transform: [{ scale: 0.98 }] },
                ]}
              >
                <View style={[styles.iconWrap, isSelected && styles.iconWrapSelected]}>
                  <Image source={m.icon} style={styles.icon} resizeMode="contain" />
                </View>
                <Text style={styles.label} numberOfLines={2}>
                  {m.label}
                </Text>
                <Text style={styles.hint}>{m.hint}</Text>
                {isSelected ? (
                  <View style={styles.check}>
                    <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label="Continue"
          trailingIcon="arrow-forward"
          onPress={() => {
            void patchOnboardingAnswers({ household: selected });
            router.push('/onboarding/priorities');
          }}
        />
        <Pressable
          hitSlop={8}
          onPress={() => {
            void patchOnboardingAnswers({ household: selected });
            router.push('/onboarding/priorities');
          }}
        >
          <Text style={styles.skip}>Skip for now</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PALETTE.bg },
  scroll: { paddingHorizontal: 22, paddingBottom: 24, backgroundColor: PALETTE.bg },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 2.4,
    fontWeight: '600',
    color: PALETTE.sageDeep,
    textTransform: 'uppercase',
  },
  headline: {
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '800',
    color: '#111111',
    letterSpacing: -1.0,
    marginTop: 8,
    maxWidth: '96%',
  },
  sub: {
    fontSize: 14,
    lineHeight: 20,
    color: PALETTE.textMuted,
    marginTop: 10,
    marginBottom: 24,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: {
    width: '31%',
    flexGrow: 1,
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignItems: 'center',
    minHeight: 130,
    position: 'relative',
  },
  cardSelected: {
    backgroundColor: PALETTE.sageSoft,
    borderColor: PALETTE.sage,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  iconWrapSelected: { backgroundColor: 'rgba(255,255,255,0.5)', borderColor: PALETTE.sage },
  icon: { width: 30, height: 30 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.text,
    marginTop: 10,
    textAlign: 'center',
  },
  hint: { fontSize: 11, color: PALETTE.textMuted, marginTop: 2, textAlign: 'center' },
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

  footer: {
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
    backgroundColor: PALETTE.bg,
    gap: 12,
    alignItems: 'center',
  },
  skip: { fontSize: 12.5, color: PALETTE.textMuted, fontWeight: '500' },
});
