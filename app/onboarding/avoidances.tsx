import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
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
  sageSoft: 'rgba(95, 135, 106, 0.04)',
};

type AvoidanceItem = {
  key: string;
  label: string;
};

type AvoidanceGroup = {
  title: string;
  items: AvoidanceItem[];
};

const AVOIDANCE_GROUPS: AvoidanceGroup[] = [
  {
    title: 'Sensitivities',
    items: [
      { key: 'fragrance', label: 'Fragrance' },
      { key: 'eo', label: 'Essential Oils' },
      { key: 'chemical', label: 'Sensitive to chemicals' },
    ],
  },
  {
    title: 'Ingredients',
    items: [
      { key: 'coconut', label: 'Coconut' },
      { key: 'vinegar', label: 'Vinegar' },
      { key: 'baking-soda', label: 'Baking Soda' },
      { key: 'castile-soap', label: 'Castile Soap' },
      { key: 'hydrogen-peroxide', label: 'Hydrogen Peroxide' },
      { key: 'rubbing-alcohol', label: 'Rubbing Alcohol' },
      { key: 'witch-hazel', label: 'Witch Hazel' },
    ],
  },
  {
    title: 'Allergies',
    items: [
      { key: 'nuts', label: 'Nuts' },
      { key: 'gluten', label: 'Gluten' },
    ],
  },
];

function toCustomKey(value: string) {
  return `custom:${value.trim().toLowerCase().replace(/\s+/g, '-')}`;
}

function AvoidanceRow({
  item,
  selected,
  isLast,
  onPress,
}: {
  item: AvoidanceItem;
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
        accessibilityLabel={item.label}
        onPress={handlePress}
        style={({ pressed }) => [
          styles.row,
          selected && styles.rowSelected,
          pressed && styles.rowPressed,
        ]}
      >
        <Animated.View style={[styles.rowTextWrap, { opacity: textOpacity }]}>
          <Text style={[styles.rowText, selected && styles.rowTextSelected]} numberOfLines={2}>
            {item.label}
          </Text>
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
    setNoneSelected(true);
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
      prev.some((item) => item.key === key)
        ? prev
        : [...prev, { key, label }],
    );
    setSelected((prev) => (prev.includes(key) ? prev : [...prev, key]));
    setNoneSelected(false);
    setCustomValue('');
    setCustomOpen(false);
  };

  const hasSelections = selected.length > 0;

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

        <View style={styles.sections}>
          {AVOIDANCE_GROUPS.map((group) => (
            <View key={group.title} style={styles.section}>
              <Text style={styles.sectionLabel}>{group.title}</Text>
              <View>
                {group.items.map((item, index) => (
                  <AvoidanceRow
                    key={item.key}
                    item={item}
                    selected={selected.includes(item.key)}
                    isLast={index === group.items.length - 1}
                    onPress={() => toggle(item.key)}
                  />
                ))}
              </View>
            </View>
          ))}

          {customItems.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Custom</Text>
              <View>
                {customItems.map((item, index) => (
                  <AvoidanceRow
                    key={item.key}
                    item={item}
                    selected={selected.includes(item.key)}
                    isLast={index === customItems.length - 1}
                    onPress={() => toggle(item.key)}
                  />
                ))}
              </View>
            </View>
          ) : null}
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            tapLight();
            setCustomOpen(true);
          }}
          style={({ pressed }) => [styles.addCustom, pressed && { opacity: 0.72 }]}
        >
          <Text style={styles.addCustomText}>Add custom ingredient</Text>
        </Pressable>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable hitSlop={8} onPress={selectNone} style={styles.noneAction}>
          <View style={[styles.noneIndicator, noneSelected && styles.indicatorSelected]}>
            {noneSelected ? <Ionicons name="checkmark" size={13} color="#FFFFFF" /> : null}
          </View>
          <Text style={[styles.noneText, noneSelected && styles.noneTextSelected]}>
            I don&apos;t avoid anything
          </Text>
        </Pressable>
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
    maxWidth: 320,
    fontSize: 28,
    lineHeight: 33,
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
  sections: {
    marginTop: 34,
  },
  section: {
    marginBottom: 34,
  },
  sectionLabel: {
    marginBottom: 12,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: PALETTE.textSubtle,
  },
  rowFrame: {
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  rowDivider: {
    borderBottomWidth: 1,
  },
  row: {
    minHeight: 54,
    paddingVertical: 18,
    paddingHorizontal: 4,
    borderRadius: 12,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowPressed: {
    backgroundColor: PALETTE.sageSoft,
  },
  rowSelected: {
    backgroundColor: PALETTE.sageSoft,
  },
  rowTextWrap: {
    flex: 1,
  },
  rowText: {
    textAlign: 'left',
    color: PALETTE.text,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
  },
  rowTextSelected: {
    color: '#101510',
  },
  indicator: {
    width: 22,
    height: 22,
    marginLeft: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#CFC9BE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorSelected: {
    borderColor: PALETTE.sageDeep,
    backgroundColor: PALETTE.sageDeep,
  },
  addCustom: {
    marginTop: -6,
    marginBottom: 32,
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
    gap: 14,
  },
  noneAction: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  noneIndicator: {
    width: 18,
    height: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#CFC9BE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noneText: {
    color: PALETTE.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  noneTextSelected: {
    color: PALETTE.sageDeep,
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
