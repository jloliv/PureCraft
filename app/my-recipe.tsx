import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/lib/auth';
import { tapLight, tapMedium, tapSoft, success, warning } from '@/lib/haptics';
import { supabase } from '@/lib/supabase';

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
  rust: '#B86F44',
};

type Ingredient = { id: string; name: string; amount: string };
type Step = { id: string; text: string };

const TAGS = ['Cleaning', 'Beauty', 'Home', 'Pet-safe', 'Baby-safe', 'Gift', 'Quick'];

const EMOJI_OPTIONS = ['🌿', '🍋', '🌸', '🧴', '🕯️', '🫧', '🍯', '🌬️', '🪻', '🧂'];

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export default function MyRecipe() {
  const [emoji, setEmoji] = useState('🌿');
  const [title, setTitle] = useState('');
  const [blurb, setBlurb] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { id: uid(), name: '', amount: '' },
    { id: uid(), name: '', amount: '' },
  ]);
  const [steps, setSteps] = useState<Step[]>([{ id: uid(), text: '' }]);
  const [saved, setSaved] = useState(false);
  const [savingError, setSavingError] = useState<string | null>(null);
  const { user } = useAuth();

  const filledIngredients = useMemo(
    () => ingredients.filter((i) => i.name.trim()).length,
    [ingredients],
  );
  const filledSteps = useMemo(() => steps.filter((s) => s.text.trim()).length, [steps]);
  const canSave = title.trim().length > 0 && filledIngredients >= 1 && filledSteps >= 1;

  const toggleTag = (t: string) => {
    tapLight();
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const updateIng = (id: string, key: 'name' | 'amount', value: string) =>
    setIngredients((prev) => prev.map((i) => (i.id === id ? { ...i, [key]: value } : i)));

  const addIng = () => {
    tapLight();
    setIngredients((prev) => [...prev, { id: uid(), name: '', amount: '' }]);
  };

  const removeIng = (id: string) => {
    warning();
    setIngredients((prev) => (prev.length <= 1 ? prev : prev.filter((i) => i.id !== id)));
  };

  const updateStep = (id: string, value: string) =>
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, text: value } : s)));

  const addStep = () => {
    tapLight();
    setSteps((prev) => [...prev, { id: uid(), text: '' }]);
  };

  const removeStep = (id: string) => {
    warning();
    setSteps((prev) => (prev.length <= 1 ? prev : prev.filter((s) => s.id !== id)));
  };

  const save = async () => {
    if (!canSave) return;
    tapMedium();
    setSavingError(null);

    // Persist to Supabase if the user is signed in. RLS policy lets only
    // authenticated users insert rows where source='user' and
    // author_user_id = auth.uid(). If unauth'd we just keep the success
    // animation as a local-only confirmation (graceful prototype fallback).
    if (user && supabase) {
      const filledIngs = ingredients.filter((i) => i.name.trim());
      const filledStepsList = steps
        .filter((s) => s.text.trim())
        .map((s) => s.text.trim());
      const ingredientStrings = filledIngs.map((i) =>
        i.amount.trim() ? `${i.amount.trim()} ${i.name.trim()}` : i.name.trim(),
      );

      const { error } = await supabase.from('recipes').insert({
        // user-recipe IDs are namespaced so they never collide with the
        // catalog's numeric IDs.
        id: `user_${user.id.slice(0, 8)}_${Date.now().toString(36)}`,
        title: title.trim(),
        category_label: 'My Recipes',
        category_key: tags.includes('Cleaning')
          ? 'cleaning'
          : tags.includes('Beauty')
            ? 'beauty-skincare'
            : tags.includes('Home')
              ? 'home-air-freshening'
              : 'cleaning',
        difficulty: 'Easy',
        time_label: '—',
        ingredients: ingredientStrings,
        instructions: filledStepsList,
        safe_for_kids: tags.includes('Baby-safe'),
        cost_savings: null,
        tags,
        source: 'user',
        author_user_id: user.id,
        is_published: true,
      });

      if (error) {
        setSavingError(error.message);
        warning();
        return;
      }
    }

    setSaved(true);
    setTimeout(() => success(), 200);
  };

  if (saved) {
    return <SavedView title={title} emoji={emoji} blurb={blurb} />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => {
              tapLight();
              router.back();
            }}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
          >
            <Ionicons name="chevron-back" size={20} color={PALETTE.text} />
          </Pressable>
          <Text style={styles.topTitle}>Save your recipe</Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <View style={styles.heroEmojiRow}>
              {EMOJI_OPTIONS.map((e) => {
                const isOn = emoji === e;
                return (
                  <Pressable
                    key={e}
                    onPress={() => {
                      tapLight();
                      setEmoji(e);
                    }}
                    style={({ pressed }) => [
                      styles.emojiBtn,
                      isOn && styles.emojiBtnActive,
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <Text style={styles.emojiText}>{e}</Text>
                  </Pressable>
                );
              })}
            </View>
            <TextInput
              placeholder="Recipe name"
              placeholderTextColor={PALETTE.textSubtle}
              value={title}
              onChangeText={setTitle}
              style={styles.titleInput}
            />
            <TextInput
              placeholder="A short, sensory blurb — what does it feel like?"
              placeholderTextColor={PALETTE.textSubtle}
              value={blurb}
              onChangeText={setBlurb}
              multiline
              style={styles.blurbInput}
            />
          </View>

          <Text style={styles.section}>Tags</Text>
          <View style={styles.tagsRow}>
            {TAGS.map((t) => {
              const isOn = tags.includes(t);
              return (
                <Pressable
                  key={t}
                  onPress={() => toggleTag(t)}
                  style={({ pressed }) => [
                    styles.tag,
                    isOn && styles.tagActive,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  {isOn ? <Ionicons name="checkmark" size={11} color="#FFFFFF" /> : null}
                  <Text style={[styles.tagText, isOn && { color: '#FFFFFF' }]}>{t}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.sectionRow}>
            <Text style={styles.section}>Ingredients</Text>
            <Text style={styles.counter}>{filledIngredients} added</Text>
          </View>
          <View style={styles.list}>
            {ingredients.map((ing, i) => (
              <View key={ing.id} style={[styles.ingRow, i === 0 && { borderTopWidth: 0 }]}>
                <View style={styles.ingDot} />
                <TextInput
                  placeholder="Ingredient"
                  placeholderTextColor={PALETTE.textSubtle}
                  value={ing.name}
                  onChangeText={(v) => updateIng(ing.id, 'name', v)}
                  style={styles.ingNameInput}
                />
                <TextInput
                  placeholder="amount"
                  placeholderTextColor={PALETTE.textSubtle}
                  value={ing.amount}
                  onChangeText={(v) => updateIng(ing.id, 'amount', v)}
                  style={styles.ingAmtInput}
                />
                {ingredients.length > 1 ? (
                  <Pressable
                    onPress={() => removeIng(ing.id)}
                    accessibilityLabel="Remove ingredient"
                    style={({ pressed }) => [styles.rowDelete, pressed && { opacity: 0.6 }]}
                  >
                    <Ionicons name="close" size={14} color={PALETTE.textSubtle} />
                  </Pressable>
                ) : null}
              </View>
            ))}
          </View>
          <Pressable
            onPress={addIng}
            style={({ pressed }) => [styles.addRow, pressed && { opacity: 0.7 }]}
          >
            <View style={styles.addIcon}>
              <Ionicons name="add" size={14} color={PALETTE.sageDeep} />
            </View>
            <Text style={styles.addText}>Add ingredient</Text>
          </Pressable>

          <View style={styles.sectionRow}>
            <Text style={styles.section}>Steps</Text>
            <Text style={styles.counter}>{filledSteps} written</Text>
          </View>
          <View style={styles.list}>
            {steps.map((s, i) => (
              <View key={s.id} style={[styles.stepRow, i === 0 && { borderTopWidth: 0 }]}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>{i + 1}</Text>
                </View>
                <TextInput
                  placeholder={`Step ${i + 1}`}
                  placeholderTextColor={PALETTE.textSubtle}
                  value={s.text}
                  onChangeText={(v) => updateStep(s.id, v)}
                  multiline
                  style={styles.stepInput}
                />
                {steps.length > 1 ? (
                  <Pressable
                    onPress={() => removeStep(s.id)}
                    accessibilityLabel="Remove step"
                    style={({ pressed }) => [styles.rowDelete, pressed && { opacity: 0.6 }]}
                  >
                    <Ionicons name="close" size={14} color={PALETTE.textSubtle} />
                  </Pressable>
                ) : null}
              </View>
            ))}
          </View>
          <Pressable
            onPress={addStep}
            style={({ pressed }) => [styles.addRow, pressed && { opacity: 0.7 }]}
          >
            <View style={styles.addIcon}>
              <Ionicons name="add" size={14} color={PALETTE.sageDeep} />
            </View>
            <Text style={styles.addText}>Add step</Text>
          </Pressable>

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.footer}>
          {savingError ? (
            <View style={styles.errorPill}>
              <Ionicons
                name="alert-circle-outline"
                size={13}
                color="#7A3B2C"
              />
              <Text style={styles.errorText}>{savingError}</Text>
            </View>
          ) : null}
          {!user ? (
            <Text style={styles.guestHint}>
              Sign in to sync this recipe across your devices.
            </Text>
          ) : null}
          <Pressable
            onPress={save}
            disabled={!canSave}
            style={({ pressed }) => [
              styles.saveBtn,
              !canSave && styles.saveBtnDisabled,
              pressed && canSave && { opacity: 0.92 },
            ]}
          >
            <Ionicons name="bookmark" size={15} color={canSave ? '#FFFFFF' : '#FFFFFFB3'} />
            <Text style={[styles.saveBtnText, !canSave && { color: '#FFFFFFB3' }]}>
              {canSave ? 'Save to my recipes' : 'Add a name + 1 step to save'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SavedView({ title, emoji, blurb }: { title: string; emoji: string; blurb: string }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.savedWrap}>
        <View style={styles.savedHero}>
          <Text style={{ fontSize: 80 }}>{emoji}</Text>
        </View>
        <View style={styles.savedBadge}>
          <Ionicons name="checkmark-circle" size={13} color={PALETTE.sageDeep} />
          <Text style={styles.savedBadgeText}>Saved to your recipes</Text>
        </View>
        <Text style={styles.savedTitle}>{title}</Text>
        {blurb ? <Text style={styles.savedBlurb}>{blurb}</Text> : null}

        <View style={styles.savedActions}>
          <Pressable
            onPress={() => {
              tapSoft();
              router.replace('/saved');
            }}
            style={({ pressed }) => [styles.savedPrimary, pressed && { opacity: 0.92 }]}
          >
            <Text style={styles.savedPrimaryText}>View in Saved</Text>
            <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
          </Pressable>
          <Pressable
            onPress={() => {
              tapLight();
              router.replace('/home');
            }}
            style={({ pressed }) => [styles.savedSecondary, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.savedSecondaryText}>Back home</Text>
          </Pressable>
        </View>
      </View>
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
  topTitle: { fontSize: 14, fontWeight: '700', color: PALETTE.text },
  scroll: { paddingHorizontal: 20, paddingBottom: 24 },

  heroCard: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#1F1F1F',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  heroEmojiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  emojiBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: PALETTE.cream,
    borderWidth: 1,
    borderColor: PALETTE.creamDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiBtnActive: { backgroundColor: PALETTE.sageSoft, borderColor: PALETTE.sage },
  emojiText: { fontSize: 18 },
  titleInput: {
    fontSize: 22,
    fontWeight: '700',
    color: PALETTE.text,
    letterSpacing: -0.5,
    paddingVertical: 6,
    minHeight: 36,
  },
  blurbInput: {
    fontSize: 13.5,
    lineHeight: 19,
    color: PALETTE.textMuted,
    minHeight: 44,
    fontWeight: '400',
  },

  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 10,
  },
  section: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.text,
    letterSpacing: -0.2,
    marginTop: 24,
    marginBottom: 10,
  },
  counter: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.sageDeep,
    letterSpacing: 0.4,
  },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  tagActive: { backgroundColor: PALETTE.sageDeep, borderColor: PALETTE.sageDeep },
  tagText: { fontSize: 12, fontWeight: '600', color: PALETTE.text },

  list: {
    backgroundColor: PALETTE.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PALETTE.border,
    overflow: 'hidden',
  },
  ingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
  },
  ingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: PALETTE.sage },
  ingNameInput: {
    flex: 1,
    fontSize: 14,
    color: PALETTE.text,
    fontWeight: '600',
    paddingVertical: 0,
  },
  ingAmtInput: {
    width: 80,
    textAlign: 'right',
    fontSize: 12,
    color: PALETTE.textMuted,
    fontWeight: '500',
    paddingVertical: 0,
  },
  rowDelete: {
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: PALETTE.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  stepRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: PALETTE.sageDeep,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepBadgeText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },
  stepInput: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 18,
    color: PALETTE.text,
    fontWeight: '500',
    minHeight: 32,
  },

  addRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: PALETTE.sageSoft,
    alignSelf: 'flex-start',
  },
  addIcon: {
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: { fontSize: 12.5, fontWeight: '700', color: PALETTE.sageDeep, letterSpacing: 0.3 },

  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
    backgroundColor: PALETTE.bg,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 999,
    backgroundColor: PALETTE.sageDeep,
    shadowColor: PALETTE.sageDeep,
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  saveBtnDisabled: {
    backgroundColor: '#B7C2B0',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveBtnText: { fontSize: 13.5, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.3 },
  errorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#FBEFEC',
    borderWidth: 1,
    borderColor: '#F1D9D2',
    marginBottom: 10,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: '#7A3B2C',
    fontWeight: '500',
  },
  guestHint: {
    fontSize: 11.5,
    color: PALETTE.textMuted,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },

  savedWrap: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  savedHero: {
    width: 130,
    height: 130,
    borderRadius: 999,
    backgroundColor: PALETTE.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: PALETTE.sageDeep,
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 5,
  },
  savedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: PALETTE.sageSoft,
  },
  savedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.sageDeep,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  savedTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: PALETTE.text,
    letterSpacing: -0.6,
    textAlign: 'center',
    marginTop: 4,
  },
  savedBlurb: {
    fontSize: 14,
    lineHeight: 20,
    color: PALETTE.textMuted,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  savedActions: { marginTop: 18, gap: 10, alignItems: 'center', alignSelf: 'stretch' },
  savedPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 999,
    backgroundColor: PALETTE.sageDeep,
    alignSelf: 'stretch',
  },
  savedPrimaryText: { fontSize: 13.5, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.3 },
  savedSecondary: { paddingVertical: 10 },
  savedSecondaryText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: PALETTE.textMuted,
    letterSpacing: 0.3,
  },
});
