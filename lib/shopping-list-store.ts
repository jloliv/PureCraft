// Persistent shopping-list state. Replaces the old per-recipe
// /shopping-list?id=<X> view (which was tied to one recipe at a time
// and pulled in store-cart integrations) with a real, durable list
// that survives app restarts and accumulates items from multiple
// recipes.
//
// Storage strategy mirrors the rest of the app — AsyncStorage on
// native, the same module is fine on web (the polyfill lands on
// localStorage). One global list for v1 (id 'default'), but the data
// model already carries a `recipes` array per list so multi-recipe
// batching ("Weekend cleaning run") is a 1-screen change away.
//
// Pricing and store integrations are deliberately ABSENT from this
// flow per the product call.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useSyncExternalStore } from 'react';

const KEY = 'purecraft_shopping_list_v1';
const DEFAULT_LIST_ID = 'default';

export type ShoppingItem = {
  /** Stable within the list. We key by recipeId + lowercased name so
   *  re-adding the same recipe doesn't double-up items, and toggling
   *  one item never accidentally toggles a same-named item from a
   *  different recipe. */
  key: string;
  name: string;
  amount: string;
  recipeId: string;
  recipeTitle: string;
  checked: boolean;
};

export type ShoppingList = {
  id: string;
  recipes: { id: string; title: string }[];
  items: ShoppingItem[];
  createdAt: number;
};

// Items the caller wants to add (typically recipe.ingredients filtered
// to !haveIt — but we don't enforce that here; the caller decides).
export type ShoppingItemInput = {
  name: string;
  amount: string;
};

const EMPTY_LIST: ShoppingList = {
  id: DEFAULT_LIST_ID,
  recipes: [],
  items: [],
  createdAt: Date.now(),
};

let list: ShoppingList = EMPTY_LIST;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function makeKey(recipeId: string, name: string): string {
  return `${recipeId}::${name.trim().toLowerCase()}`;
}

function parse(raw: string | null): ShoppingList {
  if (!raw) return { ...EMPTY_LIST, createdAt: Date.now() };
  try {
    const parsed = JSON.parse(raw) as Partial<ShoppingList>;
    return {
      id: typeof parsed.id === 'string' ? parsed.id : DEFAULT_LIST_ID,
      recipes: Array.isArray(parsed.recipes) ? parsed.recipes : [],
      items: Array.isArray(parsed.items) ? parsed.items : [],
      createdAt:
        typeof parsed.createdAt === 'number' ? parsed.createdAt : Date.now(),
    };
  } catch {
    return { ...EMPTY_LIST, createdAt: Date.now() };
  }
}

async function hydrate(): Promise<void> {
  if (hydrated) return;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    list = parse(raw);
  } catch {
    list = { ...EMPTY_LIST, createdAt: Date.now() };
  } finally {
    hydrated = true;
    emit();
  }
}

async function persist(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // Storage unavailable — keep the in-memory state usable for the
    // current session.
  }
}

// =============================================================================
// Public mutators
// =============================================================================

export async function addRecipeToList(
  recipe: { id: string; title: string },
  items: ShoppingItemInput[],
): Promise<{ added: number; alreadyPresent: number }> {
  await hydrate();
  // Track recipe meta so the share format and section headers know
  // about it. Idempotent — same id → no-op.
  const recipes = list.recipes.some((r) => r.id === recipe.id)
    ? list.recipes
    : [...list.recipes, recipe];

  const existingKeys = new Set(list.items.map((i) => i.key));
  let added = 0;
  let alreadyPresent = 0;
  const fresh: ShoppingItem[] = [];
  for (const i of items) {
    if (!i.name.trim()) continue;
    const key = makeKey(recipe.id, i.name);
    if (existingKeys.has(key)) {
      alreadyPresent += 1;
      continue;
    }
    fresh.push({
      key,
      name: i.name.trim(),
      amount: i.amount.trim(),
      recipeId: recipe.id,
      recipeTitle: recipe.title,
      checked: false,
    });
    added += 1;
  }
  list = { ...list, recipes, items: [...list.items, ...fresh] };
  emit();
  await persist();
  return { added, alreadyPresent };
}

export async function toggleListItem(key: string): Promise<void> {
  await hydrate();
  list = {
    ...list,
    items: list.items.map((i) =>
      i.key === key ? { ...i, checked: !i.checked } : i,
    ),
  };
  emit();
  await persist();
}

/** Remove every item that's currently checked. Useful for "clean up
 *  what I've already bought" without nuking the whole list. */
export async function clearCheckedItems(): Promise<void> {
  await hydrate();
  const remainingItems = list.items.filter((i) => !i.checked);
  // Drop recipes whose only items just got cleared.
  const stillReferenced = new Set(remainingItems.map((i) => i.recipeId));
  const remainingRecipes = list.recipes.filter((r) =>
    stillReferenced.has(r.id),
  );
  list = { ...list, items: remainingItems, recipes: remainingRecipes };
  emit();
  await persist();
}

/** Remove all items from a single recipe (e.g. "I changed my mind on
 *  this one"). */
export async function removeRecipeFromList(recipeId: string): Promise<void> {
  await hydrate();
  list = {
    ...list,
    recipes: list.recipes.filter((r) => r.id !== recipeId),
    items: list.items.filter((i) => i.recipeId !== recipeId),
  };
  emit();
  await persist();
}

/** Wipe the whole list. */
export async function clearShoppingList(): Promise<void> {
  await hydrate();
  list = { ...EMPTY_LIST, createdAt: Date.now() };
  emit();
  await persist();
}

// =============================================================================
// Share-output formatter — matches the spec's text shape.
// =============================================================================

export function formatShareText(l: ShoppingList): string {
  if (l.items.length === 0) return '';

  // "For: <recipe title>" — comma-joined when the list has multiple.
  const forLine = l.recipes.map((r) => r.title).join(', ');

  // Group items by recipe so the share output reads like the spec —
  // each "Ingredients:" block sits under its own recipe.
  const groups = l.recipes
    .map((r) => {
      const items = l.items.filter((i) => i.recipeId === r.id);
      if (items.length === 0) return null;
      const lines = items
        .map((i) => `- ${i.amount ? `${i.amount} ` : ''}${i.name}`)
        .join('\n');
      return l.recipes.length === 1
        ? `Ingredients:\n${lines}`
        : `Ingredients (${r.title}):\n${lines}`;
    })
    .filter((s): s is string => s !== null);

  // "Why:" — soft, human framing. Single recipe gets the precise line
  // from the spec; multi-recipe gets a slightly broader version so it
  // still reads cleanly.
  const why =
    l.recipes.length === 1
      ? `Making a natural ${l.recipes[0].title.toLowerCase()}`
      : `Making natural cleaning recipes (${l.recipes
          .map((r) => r.title)
          .join(', ')})`;

  return [
    '🛒 PureCraft Shopping List',
    '',
    `For: ${forLine}`,
    '',
    groups.join('\n\n'),
    '',
    'Why:',
    why,
    '',
    '✔ Sent from PureCraft',
  ].join('\n');
}

// =============================================================================
// React subscription
// =============================================================================

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function snapshot(): ShoppingList {
  return list;
}

export function useShoppingList(): ShoppingList {
  const value = useSyncExternalStore(subscribe, snapshot, snapshot);
  useEffect(() => {
    void hydrate();
  }, []);
  return value;
}

/** Synchronous getter for non-hook callers (e.g. analytics, share
 *  handlers triggered before any subscriber has mounted). Returns the
 *  current snapshot — may be the empty list if storage hasn't been
 *  hydrated yet. Hydration is best-effort kicked off lazily here. */
export function getShoppingListSync(): ShoppingList {
  void hydrate();
  return list;
}
