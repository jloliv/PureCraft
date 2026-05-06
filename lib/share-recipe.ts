// Share a recipe via the native Share sheet (iOS / Android / web).
//
// Plain-text only — NO links. The previous implementation appended an
// `https://purecraft.app/r/<id>` URL plus a `purecraft://` deep link,
// which broke the iMessage preview on some devices.
//
// Platform behavior:
//   - iOS / Android: react-native Share.share opens the system share
//     sheet. Picking iMessage prefills the compose field with the
//     entire `message` string.
//   - Web (Expo Web): react-native-web's Share.share calls
//     `navigator.share`, which is unavailable on most desktop browsers.
//     We catch the rejection and fall back to writing the recipe to the
//     clipboard so the user can paste it into Messages / Mail / wherever.
//
// Failures are surfaced via Alert (not silently swallowed). User
// dismissals from the native sheet are treated as success — Share.share
// resolves with `action: 'dismissedAction'`, never throws on cancel.
//
// Schema: callers pass an already-prepared payload rather than a Recipe
// object. The codebase has two competing `Recipe` types
// (`constants/products` vs `constants/recipes`), and the result screen
// pulls description from one and benefits / time from the other.
// Letting the caller assemble the payload keeps this helper free of
// either dependency and lets every share surface route through the same
// message format.

import { Alert, Platform, Share } from 'react-native';

export type RecipeShareData = {
  title: string;
  /** Short product blurb — appears under the title. */
  description: string;
  /** Pre-formatted time string, e.g. "3 min". */
  time: string;
  /** Flat ingredient strings, e.g. "1 cup white vinegar". */
  ingredients: string[];
  /** Curated benefit bullets, already capped to a sensible length. */
  benefits: string[];
};

function buildMessage(data: RecipeShareData): string {
  const ingredientsBlock = data.ingredients.map((i) => `• ${i}`).join('\n');
  const benefitsBlock = data.benefits.map((b) => `• ${b}`).join('\n');
  return (
    `🍋 ${data.title}\n\n` +
    `${data.description}\n\n` +
    `🧪 Ingredients:\n${ingredientsBlock}\n\n` +
    `⏱ ${data.time}\n\n` +
    `💡 Benefits:\n${benefitsBlock}\n\n` +
    `✨ PureCraft`
  );
}

export async function shareRecipe(data: RecipeShareData): Promise<void> {
  const message = buildMessage(data);

  // iOS / Android: native share sheet is the right primitive.
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    try {
      // Share.share resolves on success OR on user-cancel ('dismissedAction').
      // It only throws on actual failures (no share targets, malformed
      // payload, etc.).
      await Share.share({ message });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[shareRecipe] native share failed:', err);
      Alert.alert(
        'Could not share',
        'The share sheet could not open. You can copy the recipe manually and try again.',
      );
    }
    return;
  }

  // Web fallback chain:
  //   1. navigator.share (mobile Safari / Android Chrome) — opens the
  //      same kind of native sheet as RN's Share would.
  //   2. navigator.clipboard.writeText — desktop browsers. Toast tells
  //      the user the recipe is on their clipboard ready to paste.
  //   3. RN Share.share as a last resort (mostly redundant with #1).
  if (Platform.OS === 'web') {
    const nav: NavigatorShareLike =
      typeof navigator !== 'undefined' ? (navigator as NavigatorShareLike) : ({} as NavigatorShareLike);
    if (typeof nav.share === 'function') {
      try {
        await nav.share({ text: message });
        return;
      } catch (err) {
        // User cancelled or browser denied. Fall through to clipboard
        // only if the rejection wasn't a user-cancel ("AbortError").
        if (isAbortError(err)) return;
        // eslint-disable-next-line no-console
        console.warn('[shareRecipe] navigator.share failed:', err);
      }
    }
    if (nav.clipboard && typeof nav.clipboard.writeText === 'function') {
      try {
        await nav.clipboard.writeText(message);
        Alert.alert(
          'Recipe copied',
          'The full recipe is on your clipboard — paste it into Messages, email, or anywhere you like.',
        );
        return;
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[shareRecipe] clipboard write failed:', err);
      }
    }
    // Last resort — RN Share on web (rarely useful but won't hurt).
    try {
      await Share.share({ message });
    } catch {
      Alert.alert(
        'Sharing not supported',
        'This browser does not support sharing. Try again from the iOS or Android app.',
      );
    }
  }
}

// ---- helpers ---------------------------------------------------------------

type NavigatorShareLike = {
  share?: (data: { text?: string; title?: string; url?: string }) => Promise<void>;
  clipboard?: { writeText: (text: string) => Promise<void> };
};

function isAbortError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'name' in err &&
    (err as { name?: string }).name === 'AbortError'
  );
}
