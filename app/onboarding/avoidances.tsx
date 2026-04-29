import { router } from 'expo-router';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
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
  surfaceWarm: 'rgba(255,255,255,0.5)',
  border: '#E8E3D9',
  sageDeep: '#5F876A',
};

type AvoidanceItem = {
  key: string;
  label: string;
};

const AVOIDANCE_OPTIONS: AvoidanceItem[] = [
  { key: 'fragrance', label: 'Fragrance' },
  { key: 'eo', label: 'Essential Oils' },
  { key: 'chemical', label: 'Sensitive to chemicals' },
  { key: 'coconut', label: 'Coconut' },
  { key: 'vinegar', label: 'Vinegar' },
  { key: 'baking-soda', label: 'Baking Soda' },
  { key: 'castile-soap', label: 'Castile Soap' },
  { key: 'hydrogen-peroxide', label: 'Hydrogen Peroxide' },
  { key: 'rubbing-alcohol', label: 'Rubbing Alcohol' },
  { key: 'witch-hazel', label: 'Witch Hazel' },
  { key: 'nuts', label: 'Nuts' },
  { key: 'gluten', label: 'Gluten' },
];

const NONE_KEY = '__none__';

function toCustomKey(value: string) {
  return `custom:${value.trim().toLowerCase().replace(/\s+/g, '-')}`;
}

export default function Avoidances() {
  const [selected, setSelected] = useState<string[]>([]);
  const [noneSelected, setNoneSelected] = useState(false);
  const [customItems, setCustomItems] = useState<AvoidanceItem[]>([]);
  const [customOpen, setCustomOpen] = useState(false);
  const [customValue, setCustomValue] = useState('');

  const toggle = (key: string) => {
    tapLight();
    setNoneSelected(false);
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    );
  };

  const selectNone = () => {
    tapLight();
    setSelected([]);
    setNoneSelected((prev) => !prev);
  };

  const saveAndContinue = () => {
    void patchOnboardingAnswers({ avoidances: noneSelected ? [] : selected });
    router.push('/onboarding/skin');
  };

  const addCustomIngredient = () => {
    const label = customValue.trim();
    if (!label) return;

    const key = toCustomKey(label);
    tapLight();
    setCustomItems((prev) =>
      prev.some((item) => item.key === key) ? prev : [...prev, { key, label }],
    );
    setSelected((prev) => (prev.includes(key) ? prev : [...prev, key]));
    setNoneSelected(false);
    setCustomValue('');
    setCustomOpen(false);
  };

  const hasSelections = selected.length > 0 || noneSelected;
  const allChips: AvoidanceItem[] = [...AVOIDANCE_OPTIONS, ...customItems];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <OnboardingHeader step={2} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.timeHint}>Takes less than 30 seconds</Text>
        <Text style={styles.eyebrow}>Step 2</Text>
        <Text style={styles.headline}>Let&apos;s personalize your recipes</Text>
        <Text style={styles.sub}>
          We&apos;ll automatically avoid these ingredients in every recipe.
        </Text>
        <Text style={styles.instruction}>Select anything you want to avoid.</Text>

        <View style={styles.chipWrap}>
          {allChips.map((item) => {
            const isSelected = selected.includes(item.key);
            return (
              <Pressable
                key={item.key}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={item.label}
                onPress={() => toggle(item.key)}
                style={({ pressed }) => [
                  styles.chip,
                  isSelected && styles.chipSelected,
                  pressed && { transform: [{ scale: 0.97 }] },
                ]}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}

          <Pressable
            key={NONE_KEY}
            accessibilityRole="button"
            accessibilityState={{ selected: noneSelected }}
            accessibilityLabel="I don't avoid anything"
            onPress={selectNone}
            style={({ pressed }) => [
              styles.chip,
              noneSelected && styles.chipSelected,
              pressed && { transform: [{ scale: 0.97 }] },
            ]}
          >
            <Text style={[styles.chipText, noneSelected && styles.chipTextSelected]}>
              I don&apos;t avoid anything
            </Text>
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            tapLight();
            setCustomOpen(true);
          }}
          style={({ pressed }) => [styles.addCustom, pressed && { opacity: 0.72 }]}
        >
          <Text style={styles.addCustomText}>+ Add custom ingredient</Text>
        </Pressable>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          onPress={saveAndContinue}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        >
          <Text style={styles.ctaText}>{hasSelections ? 'Save & Continue' : 'Skip for now'}</Text>
        </Pressable>
      </View>

      <Modal
        animationType="fade"
        transparent
        visible={customOpen}
        onRequestClose={() => setCustomOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add custom ingredient</Text>
            <Text style={styles.modalSub}>
              We&apos;ll avoid it when tailoring future recipes.
            </Text>
            <TextInput
              autoFocus
              value={customValue}
              onChangeText={setCustomValue}
              placeholder="Ingredient name"
              placeholderTextColor={PALETTE.textSubtle}
              style={styles.input}
              returnKeyType="done"
              onSubmitEditing={addCustomIngredient}
            />
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => {
                  setCustomOpen(false);
                  setCustomValue('');
                }}
                style={styles.modalGhost}
              >
                <Text style={styles.modalGhostText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={addCustomIngredient} style={styles.modalSave}>
                <Text style={styles.modalSaveText}>Add</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PALETTE.bg },
  scrollView: { flex: 1, backgroundColor: PALETTE.bg },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 5,
    paddingBottom: 20,
    backgroundColor: PALETTE.bg,
  },
  timeHint: {
    alignSelf: 'center',
    marginTop: -6,
    marginBottom: 14,
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.textSubtle,
    letterSpacing: 0.2,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 2.4,
    fontWeight: '600',
    color: PALETTE.sageDeep,
    textTransform: 'uppercase',
  },
  headline: {
    fontSize: 26,
    lineHeight: 31,
    fontWeight: '600',
    color: PALETTE.text,
    letterSpacing: -0.5,
    marginTop: 24,
  },
  sub: {
    fontSize: 15,
    lineHeight: 22,
    color: PALETTE.textMuted,
    marginTop: 6,
  },
  instruction: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    color: PALETTE.textSubtle,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 24,
  },
  chip: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F2EDE3',
    borderWidth: 1,
    borderColor: '#E6DFD2',
  },
  chipSelected: {
    backgroundColor: PALETTE.sageDeep,
    borderColor: PALETTE.sageDeep,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2F4F3E',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  addCustom: {
    marginTop: 22,
    alignSelf: 'flex-start',
    paddingVertical: 10,
  },
  addCustomText: {
    fontSize: 14,
    fontWeight: '500',
    color: PALETTE.sageDeep,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    backgroundColor: PALETTE.bg,
    alignItems: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(26, 26, 26, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 24,
    backgroundColor: PALETTE.bg,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: PALETTE.text,
    letterSpacing: -0.2,
  },
  modalSub: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: PALETTE.textMuted,
  },
  input: {
    marginTop: 18,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    fontSize: 15,
    color: PALETTE.text,
    backgroundColor: PALETTE.surfaceWarm,
  },
  modalActions: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalGhost: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modalGhostText: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.textMuted,
  },
  modalSave: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: PALETTE.sageDeep,
  },
  modalSaveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cta: {
    width: '89%',
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
  ctaPressed: {
    opacity: 0.92,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
