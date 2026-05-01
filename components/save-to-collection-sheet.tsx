// Bottom sheet shown when the user taps the heart on a recipe.
//
// UX flow:
//   1. Sheet slides up from the bottom (RN Modal with a tap-to-close
//      backdrop).
//   2. Lists every collection. Each row shows a checkmark if the
//      current recipe is already in that collection — tapping toggles
//      membership.
//   3. "+ New collection" expands an inline input (no separate route).
//      Submitting creates the collection AND adds the recipe to it
//      in one tap.
//
// The sheet leans on lib/collections-store for state and lib/saved-
// recipes for the underlying "is saved" flag — adding a recipe to ANY
// collection ensures it's also saved in the main store; removing it
// from its LAST collection unsaves it.

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  type Collection,
  createCollection,
  isRecipeInAnyCollection,
  toggleRecipeInCollection,
  useCollections,
} from '@/lib/collections-store';
import { tapLight } from '@/lib/haptics';
import {
  isRecipeSaved,
  saveRecipe,
  unsaveRecipe,
} from '@/lib/saved-recipes';
import { Colors, Radius, Spacing, Type } from '@/constants/theme';

export type SaveToCollectionSheetProps = {
  visible: boolean;
  recipeId: string | null;
  onClose: () => void;
  /** Called when the recipe was added to a NEW collection that the
   *  parent might want to surface in a toast ("Saved to 'Cleaning'"). */
  onSaved?: (collectionName: string) => void;
  /** Called when a save attempt was blocked by the freemium gate so
   *  the parent can show its existing paywall modal. */
  onGated?: () => void;
};

export default function SaveToCollectionSheet({
  visible,
  recipeId,
  onClose,
  onSaved,
  onGated,
}: SaveToCollectionSheetProps) {
  const collections = useCollections();
  const [creating, setCreating] = useState(false);
  const [draftName, setDraftName] = useState('');
  const inputRef = useRef<TextInput | null>(null);

  // Reset transient UI state every time the sheet opens fresh.
  useEffect(() => {
    if (visible) {
      setCreating(false);
      setDraftName('');
    }
  }, [visible]);

  // Auto-focus the input when entering create mode.
  useEffect(() => {
    if (creating) {
      // Defer one tick so the input is mounted before we try to focus.
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [creating]);

  if (!recipeId) return null;

  // ----- Toggle membership in a specific collection ----------------
  const handleToggle = async (collection: Collection) => {
    tapLight();
    // Adding to a collection: ensure the recipe is also saved in the
    // main saved-recipes store so freemium gates + Supabase sync still
    // work. Skip if already saved.
    const wasInThisCollection = collection.recipeIds.includes(recipeId);
    if (!wasInThisCollection) {
      if (!isRecipeSaved(recipeId)) {
        const result = await saveRecipe(recipeId);
        if (result.gated) {
          onGated?.();
          return;
        }
        // If saveRecipe hit a non-gate error (no auth, network, etc.)
        // fall through and still write the local collection — the next
        // sync will retry the underlying save.
      }
    }
    const nowInCollection = await toggleRecipeInCollection(
      collection.id,
      recipeId,
    );
    // Removing from this collection: if it was the recipe's LAST
    // collection, also unsave from the main store so the user-visible
    // state stays consistent.
    if (!nowInCollection) {
      if (!isRecipeInAnyCollection(recipeId) && isRecipeSaved(recipeId)) {
        await unsaveRecipe(recipeId);
      }
    } else {
      onSaved?.(collection.name);
    }
    onClose();
  };

  // ----- Create a new collection and add the recipe in one go ------
  const handleCreate = async () => {
    const name = draftName.trim();
    if (!name) return;
    tapLight();
    if (!isRecipeSaved(recipeId)) {
      const result = await saveRecipe(recipeId);
      if (result.gated) {
        onGated?.();
        return;
      }
    }
    const collection = await createCollection(name);
    await toggleRecipeInCollection(collection.id, recipeId);
    onSaved?.(collection.name);
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        {/* Stop-propagation wrapper: tapping the sheet itself shouldn't
            close it — only taps on the dim backdrop should. */}
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Save to</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeBtn,
                pressed && { opacity: 0.6 },
              ]}
            >
              <Ionicons name="close" size={18} color={Colors.light.text} />
            </Pressable>
          </View>

          <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
            {collections.map((c) => {
              const inThis = c.recipeIds.includes(recipeId);
              return (
                <Pressable
                  key={c.id}
                  accessibilityRole="button"
                  accessibilityLabel={
                    inThis
                      ? `Remove from ${c.name}`
                      : `Save to ${c.name}`
                  }
                  onPress={() => handleToggle(c)}
                  style={({ pressed }) => [
                    styles.row,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <View style={styles.rowLeft}>
                    <View
                      style={[
                        styles.rowIcon,
                        c.isDefault && styles.rowIconFavorite,
                      ]}
                    >
                      <Ionicons
                        name={c.isDefault ? 'heart' : 'bookmark-outline'}
                        size={16}
                        color={
                          c.isDefault
                            ? '#FFFFFF'
                            : Colors.light.sageDeep
                        }
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowName} numberOfLines={1}>
                        {c.name}
                      </Text>
                      <Text style={styles.rowMeta}>
                        {c.recipeIds.length}{' '}
                        {c.recipeIds.length === 1 ? 'recipe' : 'recipes'}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.check,
                      inThis && styles.checkOn,
                    ]}
                  >
                    {inThis ? (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          {creating ? (
            <View style={styles.createRow}>
              <TextInput
                ref={inputRef}
                value={draftName}
                onChangeText={setDraftName}
                placeholder="Collection name"
                placeholderTextColor={Colors.light.textSubtle}
                style={styles.createInput}
                autoFocus
                returnKeyType="done"
                maxLength={40}
                onSubmitEditing={handleCreate}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Create collection"
                onPress={handleCreate}
                disabled={!draftName.trim()}
                style={({ pressed }) => [
                  styles.createBtn,
                  !draftName.trim() && styles.createBtnDisabled,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text style={styles.createBtnText}>Create</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="New collection"
              onPress={() => setCreating(true)}
              style={({ pressed }) => [
                styles.newBtn,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Ionicons
                name="add-circle-outline"
                size={18}
                color={Colors.light.sageDeep}
              />
              <Text style={styles.newBtnText}>New collection</Text>
            </Pressable>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
    maxHeight: '70%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: Colors.light.border,
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: Colors.light.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    maxHeight: 360,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconFavorite: {
    backgroundColor: Colors.light.sageDeep,
    borderColor: Colors.light.sageDeep,
  },
  rowName: {
    ...Type.bodyStrong,
    color: Colors.light.text,
  },
  rowMeta: {
    ...Type.caption,
    color: Colors.light.textMuted,
    marginTop: 1,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: {
    backgroundColor: Colors.light.sageDeep,
    borderColor: Colors.light.sageDeep,
  },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 4,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  newBtnText: {
    ...Type.bodyStrong,
    color: Colors.light.sageDeep,
  },
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: 16,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  createInput: {
    flex: 1,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    fontSize: 15,
    color: Colors.light.text,
  },
  createBtn: {
    paddingHorizontal: 18,
    height: 44,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.sageDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtnDisabled: {
    opacity: 0.4,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
