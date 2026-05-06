// Store-search URL builder + print fallback for the adaptive shopping
// button. The shopping-list footer wires preferredStores -> openStore /
// printIngredients -> the user's browser or system print sheet.
//
// Search-quality note: ingredient strings in the catalog often carry
// quantities ("2 cups distilled water"). Feeding that raw to a search
// URL gives terrible results, so we run every ingredient through
// extractIngredientName from constants/smart-swaps to strip amounts /
// units before joining. Same helper the Amazon search card used.

import { Linking, Platform, Share } from 'react-native';

import { extractIngredientName } from '@/constants/smart-swaps';
import type { StoreKey } from './store-prefs';

export type ShoppingIngredient = {
  /** Raw ingredient string (may carry quantities). */
  name: string;
};

function buildQuery(ingredients: ShoppingIngredient[]): string {
  // Comma-separated names (no quantities, no units). Search engines treat
  // commas and spaces equivalently as token delimiters, but the comma
  // form reads more like a shopping list and matches the spec for the
  // "1-tap add to cart" flow.
  return ingredients
    .map((i) => extractIngredientName(i.name))
    .filter((s) => s.length > 0)
    .join(', ');
}

// Public for test / preview — also exported so the store-action button
// can show "no items to buy" when this would produce an empty URL.
export function buildStoreUrl(
  store: StoreKey,
  ingredients: ShoppingIngredient[],
): string | null {
  const query = buildQuery(ingredients);
  if (!query) return null;
  const q = encodeURIComponent(query);
  switch (store) {
    case 'walmart':
      return `https://www.walmart.com/search?q=${q}`;
    case 'target':
      return `https://www.target.com/s?searchTerm=${q}`;
    case 'amazon': {
      // Preserve the affiliate-tag plumbing the old Amazon card used.
      // No tag set in env? Drop it — the URL still works, we just don't
      // earn commission until Amazon Associates approves the account.
      const tag = process.env.EXPO_PUBLIC_AMAZON_TAG;
      const tail = tag ? `&tag=${encodeURIComponent(tag)}` : '';
      return `https://www.amazon.com/s?k=${q}${tail}`;
    }
    case 'instacart':
      return `https://www.instacart.com/store/search_v3/${q}`;
  }
}

export async function openStore(
  store: StoreKey,
  ingredients: ShoppingIngredient[],
): Promise<void> {
  const url = buildStoreUrl(store, ingredients);
  if (!url) return;
  try {
    await Linking.openURL(url);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[openStore] could not open URL:', err);
  }
}

// =============================================================================
// Print fallback
// =============================================================================
//
// On native, expo-print is the right primitive — it routes to the system
// print sheet (AirPrint / Google Cloud Print). expo-print isn't currently
// in package.json; rather than block this feature on a dependency
// install, we dynamic-import it and degrade to the share-sheet (a
// plain-text shopping list) when the module isn't available. On web we
// open a print-ready window.
//
// To enable real printing on native:
//   npx expo install expo-print
// Once installed the dynamic import resolves and the feature switches on
// automatically — no other code changes needed.

function buildPrintHtml(
  recipeTitle: string,
  ingredients: ShoppingIngredient[],
): string {
  const items = ingredients
    .map(
      (i) =>
        `<li style="padding:6px 0;border-bottom:1px dashed #d6d0c0;">${escapeHtml(
          i.name,
        )}</li>`,
    )
    .join('');
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Shopping list — ${escapeHtml(recipeTitle)}</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 32px; color: #1F1F1F; }
      h1 { font-size: 22px; margin: 0 0 4px; letter-spacing: -0.3px; }
      p.sub { color: #6F6A60; margin: 0 0 24px; font-size: 13px; }
      ul { list-style: none; padding: 0; margin: 0; }
      .footer { margin-top: 32px; font-size: 11px; color: #A8A398; letter-spacing: 1.5px; text-transform: uppercase; }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(recipeTitle)}</h1>
    <p class="sub">Shopping list — ${ingredients.length} ${ingredients.length === 1 ? 'item' : 'items'}</p>
    <ul>${items}</ul>
    <div class="footer">Made with PureCraft</div>
  </body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function printIngredients(
  ingredients: ShoppingIngredient[],
  opts?: { recipeTitle?: string },
): Promise<void> {
  if (ingredients.length === 0) return;
  const recipeTitle = opts?.recipeTitle ?? 'Shopping list';
  const html = buildPrintHtml(recipeTitle, ingredients);

  // Web — open a print-ready window. Works in any browser without
  // native modules.
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const w = window.open('', '_blank');
    if (w && w.document) {
      w.document.open();
      w.document.write(html);
      w.document.close();
      // Slight delay so layout settles before the print dialog opens.
      setTimeout(() => {
        try {
          w.focus();
          w.print();
        } catch {
          // popup blocked or print disallowed — leave the window open
          // so the user can print from the menu.
        }
      }, 250);
    }
    return;
  }

  // Native — try expo-print, fall back to Share if missing.
  try {
    // Dynamic import keeps the dependency optional. If expo-print isn't
    // installed yet, this throws and we fall through to the Share path.
    const Print = (await import(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore — optional peer dependency, install via `expo install expo-print`.
      'expo-print'
    )) as { printAsync: (opts: { html: string }) => Promise<unknown> };
    await Print.printAsync({ html });
    return;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(
      '[printIngredients] expo-print unavailable — falling back to Share:',
      err,
    );
  }

  // Last resort — share the shopping list as plain text. Gets the same
  // information into the user's hands without a print pipeline.
  try {
    const message =
      `${recipeTitle}\n\n` +
      ingredients.map((i) => `• ${i.name}`).join('\n') +
      `\n\nMade with PureCraft`;
    await Share.share({ message });
  } catch {
    // Cancelled or unavailable — nothing more we can do.
  }
}
