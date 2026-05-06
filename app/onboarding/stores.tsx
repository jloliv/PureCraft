// Onboarding step 9 — "Where do you shop?"
//
// Final gate before /onboarding/loading. We force the user to pick at
// least one store because the shopping-list footer's adaptive button
// is meaningfully better when stores are configured (instant action /
// drop-up vs. a print-only fallback). Skipping at this step would push
// most users into the print fallback, which kills the whole feature's
// value.
//
// Saves directly to lib/store-prefs (local AsyncStorage / localStorage),
// not to onboarding-answers, because preferred stores are a device-level
// preference rather than a profile attribute synced through Supabase.
// The shopping-list screen already reads from the same store, so the
// preference is live the moment the user reaches /home.
//
// Visual language matches app/onboarding/priorities.tsx — same eyebrow,
// headline, sub, hint, 2-col card grid, sage selected state, footer
// PrimaryButton.

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
import {
  PREFERRED_STORES_LIMIT,
  setPreferredStores,
  STORE_OPTIONS,
  type StoreKey,
} from '@/lib/store-prefs';

const PALETTE = {
  bg: BACKGROUND_PRIMARY,
  text: '#1F1F1F',
  textMuted: '#6B6B6B',
  textSubtle: '#8A8A8A',
  surface: 'rgba(255,255,255,0.5)',
  border: 'rgba(0,0,0,0.06)',
  sage: '#A8B8A0',
  sageDeep: '#5F876A',
  sageSoft: '#E4EDE5',
};

// Custom brand-icon assets. Walmart and Target deliberately share the
// neutral storefront icon — pixel-perfect brand marks would need legal
// sign-off and a higher-resolution source. Amazon and Instacart get
// dedicated icons.
//
// Instacart uses its own bike/delivery icon asset.
//
// All icons should be transparent PNGs with consistent stroke weight
// and uniform internal padding so they read as one set inside the
// circular container below. If any icon arrives with a baked-in
// background or visibly different scale, fix the asset rather than
// trying to compensate via styling here.
const STORE_ICONS: Record<StoreKey, ImageSourcePropType> = {
  walmart: require('../../assets/images/store-icon.png'),
  target: require('../../assets/images/store-icon.png'),
  amazon: require('../../assets/images/Amazon-Icon.png'),
  instacart: require('../../assets/images/Instacart-icon.png'),
};

export default function OnboardingStores() {
  const [selected, setSelected] = useState<StoreKey[]>([]);

  const toggle = (key: StoreKey) => {
    setSelected((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      if (prev.length >= PREFERRED_STORES_LIMIT) return prev;
      return [...prev, key];
    });
  };

  const handleContinue = () => {
    if (selected.length === 0) return;
    // Persist FIRST so the shopping-list footer reads the right state
    // even if the user backs out of /loading or kills the app mid-flow.
    void setPreferredStores(selected);
    router.push('/onboarding/loading');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <OnboardingHeader step={9} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>Step 9</Text>
        <Text style={styles.headline}>Where do you shop?</Text>
        <Text style={styles.sub}>
          We&apos;ll open your ingredients directly in your favorite store.
        </Text>
        <Text style={styles.selectHint}>Choose up to {PREFERRED_STORES_LIMIT}</Text>

        <View style={styles.grid}>
          {STORE_OPTIONS.map((opt) => {
            const isSelected = selected.includes(opt.key);
            const disabled =
              !isSelected && selected.length >= PREFERRED_STORES_LIMIT;
            return (
              <Pressable
                key={opt.key}
                onPress={() => toggle(opt.key)}
                disabled={disabled}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected, disabled }}
                accessibilityLabel={`${opt.label} — ${
                  isSelected ? 'remove' : 'add'
                }`}
                style={({ pressed }) => [
                  styles.card,
                  isSelected && styles.cardSelected,
                  disabled && { opacity: 0.4 },
                  pressed && !disabled && { transform: [{ scale: 0.97 }] },
                ]}
              >
                <View style={styles.iconWrap}>
                  <Image
                    source={STORE_ICONS[opt.key]}
                    style={styles.iconImage}
                    resizeMode="contain"
                    accessibilityIgnoresInvertColors
                  />
                </View>
                <Text style={styles.label}>{opt.label}</Text>
                <Text style={styles.tagline} numberOfLines={2}>
                  {opt.tagline}
                </Text>
                {isSelected ? (
                  <View style={styles.checkmark}>
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color={PALETTE.sageDeep}
                    />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        {/* Reassurance copy — removes hesitation about "what if I pick
            wrong" by signalling the choice is reversible. Without it,
            users tend to skip-tap rather than commit. */}
        <View style={styles.note}>
          <Ionicons
            name="information-circle-outline"
            size={14}
            color={PALETTE.textMuted}
          />
          <Text style={styles.noteText}>
            You can change this anytime in settings.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label="Continue"
          trailingIcon={selected.length > 0 ? 'arrow-forward' : undefined}
          disabled={selected.length === 0}
          onPress={handleContinue}
        />
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
    fontSize: 26,
    lineHeight: 30,
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
  selectHint: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.textSubtle,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginTop: 18,
    marginBottom: 18,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },
  card: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: 20,
    backgroundColor: '#F6F1E8',
    borderWidth: 1,
    borderColor: '#E6DFD2',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    position: 'relative',
  },
  cardSelected: {
    borderColor: PALETTE.sageDeep,
    backgroundColor: 'rgba(95,135,106,0.08)',
  },
  // 64×64 cream circle per the custom-icon spec — gives the new brand
  // marks more breathing room than the previous 56×56 sage-tint wrap.
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F4F2EC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  // 34×34 keeps the icon visually centered with consistent inner
  // padding inside the 64×64 wrap. resizeMode:contain (set on the
  // <Image>) ensures non-square assets don't stretch.
  iconImage: {
    width: 34,
    height: 34,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    color: '#2F4F3E',
    letterSpacing: -0.1,
  },
  tagline: {
    fontSize: 11.5,
    lineHeight: 15,
    color: PALETTE.textMuted,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  checkmark: {
    position: 'absolute',
    top: 10,
    right: 10,
  },

  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 22,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  noteText: {
    fontSize: 12,
    color: PALETTE.textMuted,
    letterSpacing: 0.1,
  },

  footer: {
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
    backgroundColor: PALETTE.bg,
  },
});
