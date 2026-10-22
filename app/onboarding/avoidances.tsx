import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
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
import {
  ALL_AVOIDANCES,
  PRIMARY_AVOIDANCES,
  toCustomAvoidanceKey,
  type AvoidanceItem,
} from '@/constants/avoidance-catalog';
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

const NONE_KEY = '__none__';

export default function Avoidances() {
  const [selected, setSelected] = useState<string[]>([]);
  const [noneSelected, setNoneSelected] = useState(false);
  const [customItems, setCustomItems] = useState<AvoidanceItem[]>([]);
  const [customOpen, setCustomOpen] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [seeAllOpen, setSeeAllOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [confirmedLabel, setConfirmedLabel] = useState<string | null>(null);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    };
  }, []);

  const flashConfirmation = (label: string) => {
    setConfirmedLabel(label);
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    confirmTimer.current = setTimeout(() => setConfirmedLabel(null), 2000);
  };

  const toggle = (key: string, label: string) => {
    tapLight();
    setNoneSelected(false);
    setSelected((prev) => {
      const isAdding = !prev.includes(key);
      if (isAdding) flashConfirmation(label);
      return isAdding ? [...prev, key] : prev.filter((item) => item !== key);
    });
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

    const key = toCustomAvoidanceKey(label);
    tapLight();
    setCustomItems((prev) =>
      prev.some((item) => item.key === key) ? prev : [...prev, { key, label }],
    );
    setSelected((prev) => (prev.includes(key) ? prev : [...prev, key]));
    setNoneSelected(false);
    flashConfirmation(label);
    setCustomValue('');
    setCustomOpen(false);
  };

  const closeSeeAll = () => {
    setSeeAllOpen(false);
    setSearchValue('');
  };

  const seeAllResults = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return ALL_AVOIDANCES;
    return ALL_AVOIDANCES.filter(
      (item) =>
        item.label.toLowerCase().includes(query) ||
        item.key.replace(/-/g, ' ').includes(query) ||
        item.matchTerms?.some((t) => t.toLowerCase().includes(query)),
    );
  }, [searchValue]);

  const trimmedSearch = searchValue.trim();
  const canAddSearchAsCustom =
    trimmedSearch.length > 0 &&
    !ALL_AVOIDANCES.some(
      (it) => it.label.toLowerCase() === trimmedSearch.toLowerCase(),
    );

  const addFromSearch = () => {
    if (!trimmedSearch) return;
    const key = toCustomAvoidanceKey(trimmedSearch);
    tapLight();
    setCustomItems((prev) =>
      prev.some((item) => item.key === key)
        ? prev
        : [...prev, { key, label: trimmedSearch }],
    );
    setSelected((prev) => (prev.includes(key) ? prev : [...prev, key]));
    setNoneSelected(false);
    flashConfirmation(trimmedSearch);
    closeSeeAll();
  };

  const hasSelections = selected.length > 0 || noneSelected;

  // The chip grid shows curated primary chips + any custom additions + any
  // extended catalog items the user has already selected (from "See all").
  const visibleChips: AvoidanceItem[] = useMemo(() => {
    const seen = new Set<string>();
    const list: AvoidanceItem[] = [];
    for (const item of PRIMARY_AVOIDANCES) {
      if (!seen.has(item.key)) {
        seen.add(item.key);
        list.push(item);
      }
    }
    for (const item of ALL_AVOIDANCES) {
      if (selected.includes(item.key) && !seen.has(item.key)) {
        seen.add(item.key);
        list.push(item);
      }
    }
    for (const item of customItems) {
      if (!seen.has(item.key)) {
        seen.add(item.key);
        list.push(item);
      }
    }
    return list;
  }, [customItems, selected]);

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
        <Text style={styles.headline}>Avoid ingredients in your recipes</Text>
        <Text style={styles.sub}>Tap anything you want us to leave out.</Text>

        <View style={styles.helperRow}>
          {confirmedLabel ? (
            <View style={styles.confirmation}>
              <Ionicons name="checkmark-circle" size={14} color={PALETTE.sageDeep} />
              <Text style={styles.confirmationText}>{confirmedLabel} will be avoided</Text>
            </View>
          ) : (
            <Text style={styles.helperLabel}>Tap to exclude</Text>
          )}
        </View>

        <View style={styles.chipWrap}>
          {visibleChips.map((item) => {
            const isSelected = selected.includes(item.key);
            return (
              <Pressable
                key={item.key}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={item.label}
                onPress={() => toggle(item.key, item.label)}
                style={({ pressed }) => [
                  styles.chip,
                  isSelected && styles.chipSelected,
                  pressed && { transform: [{ scale: 0.97 }] },
                ]}
              >
                {isSelected && (
                  <Ionicons
                    name="checkmark"
                    size={14}
                    color="#FFFFFF"
                    style={styles.chipIcon}
                  />
                )}
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
            accessibilityLabel="I'm okay with all ingredients"
            onPress={selectNone}
            style={({ pressed }) => [
              styles.chip,
              noneSelected && styles.chipSelected,
              pressed && { transform: [{ scale: 0.97 }] },
            ]}
          >
            {noneSelected && (
              <Ionicons name="checkmark" size={14} color="#FFFFFF" style={styles.chipIcon} />
            )}
            <Text style={[styles.chipText, noneSelected && styles.chipTextSelected]}>
              I&apos;m okay with all ingredients
            </Text>
          </Pressable>
        </View>

        <View style={styles.linkRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              tapLight();
              setSeeAllOpen(true);
            }}
            style={({ pressed }) => [styles.linkButton, pressed && { opacity: 0.72 }]}
          >
            <Text style={styles.linkText}>+ See all ingredients</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              tapLight();
              setCustomOpen(true);
            }}
            style={({ pressed }) => [styles.linkButton, pressed && { opacity: 0.72 }]}
          >
            <Text style={styles.linkText}>+ Add something else to avoid</Text>
          </Pressable>
        </View>
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
            <Text style={styles.modalTitle}>Add something else to avoid</Text>
            <Text style={styles.modalSub}>
              We&apos;ll match it across recipe ingredients (e.g.&nbsp;&quot;aloe&quot; blocks
              aloe vera, aloe extract, and aloe juice).
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

      <Modal
        animationType="slide"
        transparent
        visible={seeAllOpen}
        onRequestClose={closeSeeAll}
      >
        <View style={styles.sheetBackdrop}>
          <View style={styles.sheetCard}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>All ingredients</Text>
              <Pressable
                accessibilityRole="button"
                onPress={closeSeeAll}
                style={({ pressed }) => [styles.sheetClose, pressed && { opacity: 0.6 }]}
              >
                <Ionicons name="close" size={22} color={PALETTE.textMuted} />
              </Pressable>
            </View>

            <View style={styles.searchRow}>
              <Ionicons
                name="search"
                size={16}
                color={PALETTE.textSubtle}
                style={styles.searchIcon}
              />
              <TextInput
                autoFocus
                value={searchValue}
                onChangeText={setSearchValue}
                placeholder="Search ingredients (e.g., aloe, shea, lavender)"
                placeholderTextColor={PALETTE.textSubtle}
                style={styles.searchInput}
                returnKeyType="search"
              />
            </View>
            <Text style={styles.searchHelp}>Search or add anything you want to avoid</Text>

            <ScrollView
              style={styles.sheetScroll}
              contentContainerStyle={styles.sheetScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {seeAllResults.length === 0 && !canAddSearchAsCustom && (
                <Text style={styles.emptyText}>No matches.</Text>
              )}

              {seeAllResults.map((item) => {
                const isSelected = selected.includes(item.key);
                return (
                  <Pressable
                    key={item.key}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => toggle(item.key, item.label)}
                    style={({ pressed }) => [
                      styles.sheetRow,
                      pressed && { opacity: 0.72 },
                    ]}
                  >
                    <Text style={styles.sheetRowLabel}>{item.label}</Text>
                    <View
                      style={[
                        styles.sheetCheck,
                        isSelected && styles.sheetCheckActive,
                      ]}
                    >
                      {isSelected && (
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      )}
                    </View>
                  </Pressable>
                );
              })}

              {canAddSearchAsCustom && (
                <Pressable
                  accessibilityRole="button"
                  onPress={addFromSearch}
                  style={({ pressed }) => [
                    styles.sheetRow,
                    styles.sheetAddRow,
                    pressed && { opacity: 0.72 },
                  ]}
                >
                  <Text style={styles.sheetAddLabel}>
                    + Add &quot;{trimmedSearch}&quot; to avoid
                  </Text>
                </Pressable>
              )}
            </ScrollView>
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
    fontSize: 16,
    lineHeight: 23,
    color: PALETTE.textMuted,
    marginTop: 8,
  },
  helperRow: {
    marginTop: 18,
    minHeight: 18,
    justifyContent: 'center',
  },
  helperLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.2,
    color: PALETTE.textSubtle,
    textTransform: 'uppercase',
  },
  confirmation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  confirmationText: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.sageDeep,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#D8D2C4',
  },
  chipSelected: {
    backgroundColor: PALETTE.sageDeep,
    borderColor: PALETTE.sageDeep,
  },
  chipIcon: {
    marginRight: 6,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2F4F3E',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  linkRow: {
    marginTop: 22,
    gap: 4,
    alignItems: 'flex-start',
  },
  linkButton: {
    paddingVertical: 10,
  },
  linkText: {
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
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(26, 26, 26, 0.32)',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    backgroundColor: PALETTE.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 8,
    paddingHorizontal: 20,
    paddingBottom: 28,
    maxHeight: '88%',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D8D2C4',
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: PALETTE.text,
    letterSpacing: -0.2,
  },
  sheetClose: {
    padding: 6,
    margin: -6,
  },
  searchRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: PALETTE.surfaceWarm,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: PALETTE.text,
  },
  searchHelp: {
    marginTop: 8,
    fontSize: 12,
    color: PALETTE.textSubtle,
  },
  sheetScroll: {
    marginTop: 12,
  },
  sheetScrollContent: {
    paddingBottom: 12,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.border,
  },
  sheetRowLabel: {
    fontSize: 15,
    color: PALETTE.text,
    flex: 1,
  },
  sheetCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D8D2C4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCheckActive: {
    borderColor: PALETTE.sageDeep,
    backgroundColor: PALETTE.sageDeep,
  },
  sheetAddRow: {
    borderBottomWidth: 0,
    paddingTop: 18,
  },
  sheetAddLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: PALETTE.sageDeep,
  },
  emptyText: {
    paddingVertical: 24,
    fontSize: 14,
    color: PALETTE.textMuted,
    textAlign: 'center',
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
