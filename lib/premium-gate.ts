// Centralized "open premium UI" entry point that enforces the guest
// auth-gate. Every CTA that would take the user to the paywall MUST
// route through this hook instead of calling router.push('/premium')
// directly — otherwise a guest could land on the purchase screen and
// create an entitlement we can't tie to a Supabase user.
//
// Flow:
//   Guest      → /auth/upsell?next=/premium  (friendly explainer that
//                routes to sign-up / sign-in)
//   Signed-in  → /premium                    (paywall as usual)
//
// The ?next param is consumed by components/auth-form.tsx — once the
// user finishes signing in or creating an account it router.replaces
// to /premium, so they land directly on the paywall without any extra
// taps.

import { router } from 'expo-router';
import { useCallback } from 'react';

import { useAuth } from './auth';

export type RequirePremiumOptions = {
  /** Where to land the user after auth completes. Defaults to '/premium'. */
  next?: string;
};

/**
 * Returns a `requirePremium()` function that routes the user to the
 * appropriate screen based on auth state. Use this from any "Upgrade",
 * "Unlock", "Go Plus" CTA — never call router.push('/premium') directly.
 */
export function useRequirePremium() {
  const { user } = useAuth();
  return useCallback(
    (opts?: RequirePremiumOptions) => {
      const next = opts?.next ?? '/premium';
      if (!user) {
        router.push(
          `/auth/upsell?next=${encodeURIComponent(next)}` as never,
        );
        return;
      }
      router.push(next as never);
    },
    [user],
  );
}
