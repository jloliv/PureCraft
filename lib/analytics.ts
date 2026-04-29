// Lightweight analytics wrapper.
//
// Why a wrapper instead of importing PostHog directly: keeps call sites
// vendor-agnostic and lets the app boot cleanly when no API key is set
// (which is the dev default — you don't want every screen logging "PostHog
// not configured" warnings on every render).
//
// To enable in production:
//   1. `npm install posthog-react-native`
//   2. Set EXPO_PUBLIC_POSTHOG_KEY in `.env`
//   3. Optionally set EXPO_PUBLIC_POSTHOG_HOST (defaults to app.posthog.com)
//   4. Restart Metro with `--clear` so the new env vars land
//
// Without those, every call below is a silent no-op.

const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;

let client: PostHogLike | null = null;
let queue: Array<() => void> = [];

// Minimal interface — matches what we actually call. Lets us swap vendors
// without changing call sites.
interface PostHogLike {
  capture: (event: string, props?: Record<string, unknown>) => void;
  identify: (id: string, props?: Record<string, unknown>) => void;
  reset: () => void;
}

// Lazy-load PostHog only if a key is present. Avoids requiring the package
// in dev builds that don't have it installed.
async function loadClient(): Promise<void> {
  if (!POSTHOG_KEY || client) return;
  try {
    const mod = (await import('posthog-react-native')) as unknown as {
      PostHog?: new (key: string, opts: { host: string }) => PostHogLike;
      default?: new (key: string, opts: { host: string }) => PostHogLike;
    };
    const PostHogCtor = mod.PostHog ?? mod.default;
    if (!PostHogCtor) return;
    client = new PostHogCtor(POSTHOG_KEY, {
      host: process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com',
    });
    // Flush anything captured before the client was ready
    for (const fn of queue) fn();
    queue = [];
  } catch {
    // Init failed — stay disabled.
  }
}
void loadClient();

function whenReady(fn: () => void) {
  if (client) fn();
  else queue.push(fn);
}

export function track(
  event: string,
  props?: Record<string, unknown>,
): void {
  if (!POSTHOG_KEY) return; // disabled in dev
  whenReady(() => client?.capture(event, props));
}

export function identify(
  userId: string,
  props?: Record<string, unknown>,
): void {
  if (!POSTHOG_KEY) return;
  whenReady(() => client?.identify(userId, props));
}

export function resetAnalytics(): void {
  if (!POSTHOG_KEY) return;
  whenReady(() => client?.reset());
}

// Convenience helpers for the most important product events. Keep the event
// names canonical here so we don't end up with "recipe_saved" + "saved_recipe"
// + "save_recipe" floating around.
export const events = {
  signedUp: () => track('signed_up'),
  signedIn: () => track('signed_in'),
  signedOut: () => track('signed_out'),
  onboardingStepCompleted: (step: number, name: string) =>
    track('onboarding_step_completed', { step, name }),
  onboardingFinished: () => track('onboarding_finished'),
  recipeViewed: (id: string) => track('recipe_viewed', { recipe_id: id }),
  recipeSaved: (id: string) => track('recipe_saved', { recipe_id: id }),
  recipeUnsaved: (id: string) => track('recipe_unsaved', { recipe_id: id }),
  recipeMade: (id: string) => track('recipe_made', { recipe_id: id }),
  aiGenerationRequested: (promptLen: number) =>
    track('ai_generation_requested', { prompt_length: promptLen }),
  aiGenerationCompleted: (id: string) =>
    track('ai_generation_completed', { recipe_id: id }),
  aiGenerationFailed: (errorMsg: string) =>
    track('ai_generation_failed', { error: errorMsg }),
  paywallViewed: () => track('paywall_viewed'),
  paywallPurchased: (productId: string) =>
    track('paywall_purchased', { product_id: productId }),
  searchPerformed: (query: string, resultCount: number) =>
    track('search_performed', { query, result_count: resultCount }),
};
