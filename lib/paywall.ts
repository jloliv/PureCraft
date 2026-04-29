// RevenueCat paywall + entitlement scaffold.
//
// Why RevenueCat: handles Apple/Google receipt validation, restore purchases,
// and entitlement state across both platforms with one SDK + one dashboard.
// Without it, you reimplement StoreKit2 + Play Billing, validate receipts on
// your server, and reconcile subscription state — months of work.
//
// To enable in production:
//   1. `npx expo install react-native-purchases`
//   2. Create a RevenueCat project + get the public API keys (one per platform)
//   3. Set EXPO_PUBLIC_REVENUECAT_KEY_IOS and EXPO_PUBLIC_REVENUECAT_KEY_ANDROID in `.env`
//   4. Configure your "purecraft_plus" entitlement and Apple/Google products
//      in the RevenueCat dashboard
//
// Without keys, every export here is a no-op and isPremium() returns false
// so the app stays runnable in dev.

import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

const KEY =
  Platform.OS === 'ios'
    ? process.env.EXPO_PUBLIC_REVENUECAT_KEY_IOS
    : process.env.EXPO_PUBLIC_REVENUECAT_KEY_ANDROID;

const ENTITLEMENT = 'purecraft_plus';

type PaywallState = {
  isPremium: boolean;
  loading: boolean;
  offerings: PaywallOffering[];
};

export type PaywallOffering = {
  identifier: string;
  description: string;
  priceString: string;
  cadence: 'monthly' | 'yearly' | 'lifetime' | 'unknown';
};

let state: PaywallState = { isPremium: false, loading: !!KEY, offerings: [] };
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

interface PurchasesLike {
  configure: (cfg: { apiKey: string; appUserID?: string }) => void;
  getCustomerInfo: () => Promise<{ entitlements: { active: Record<string, unknown> } }>;
  getOfferings: () => Promise<{
    current: { availablePackages: PurchasesPackage[] } | null;
  }>;
  purchasePackage: (pkg: PurchasesPackage) => Promise<{
    customerInfo: { entitlements: { active: Record<string, unknown> } };
  }>;
  restorePurchases: () => Promise<{ entitlements: { active: Record<string, unknown> } }>;
  logIn: (id: string) => Promise<unknown>;
  logOut: () => Promise<unknown>;
}

interface PurchasesPackage {
  identifier: string;
  packageType: string;
  product: { description: string; priceString: string };
}

let client: PurchasesLike | null = null;

async function loadClient(): Promise<void> {
  if (!KEY || client) return;
  try {
    const mod = (await import('react-native-purchases')) as unknown as {
      default?: PurchasesLike;
    } & PurchasesLike;
    // Real SDK has more parameters on purchasePackage etc. — our local
    // interface is a strict subset, so cast through unknown.
    const Purchases = (mod.default ?? mod) as unknown as PurchasesLike;
    Purchases.configure({ apiKey: KEY });
    client = Purchases;
    await refreshState();
  } catch {
    // Init failed — stay disabled.
    state = { isPremium: false, loading: false, offerings: [] };
    emit();
  }
}
void loadClient();

async function refreshState(): Promise<void> {
  if (!client) {
    state = { isPremium: false, loading: false, offerings: [] };
    emit();
    return;
  }
  try {
    const [info, offers] = await Promise.all([
      client.getCustomerInfo(),
      client.getOfferings(),
    ]);
    const offerings: PaywallOffering[] =
      offers.current?.availablePackages.map((p) => ({
        identifier: p.identifier,
        description: p.product.description,
        priceString: p.product.priceString,
        cadence:
          p.packageType === 'MONTHLY'
            ? 'monthly'
            : p.packageType === 'ANNUAL'
              ? 'yearly'
              : p.packageType === 'LIFETIME'
                ? 'lifetime'
                : 'unknown',
      })) ?? [];
    state = {
      isPremium: !!info.entitlements.active[ENTITLEMENT],
      loading: false,
      offerings,
    };
    emit();
  } catch {
    state = { ...state, loading: false };
    emit();
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
function snapshot() {
  return state;
}

export function usePaywall(): PaywallState {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

export function isPremium(): boolean {
  return state.isPremium;
}

// Identify the current user with RevenueCat so entitlements travel across
// devices. Call after sign-in.
export async function identifyPaywallUser(userId: string): Promise<void> {
  if (!client) return;
  try {
    await client.logIn(userId);
    await refreshState();
  } catch {
    // ignore
  }
}

export async function logOutPaywallUser(): Promise<void> {
  if (!client) return;
  try {
    await client.logOut();
    await refreshState();
  } catch {
    // ignore
  }
}

export async function purchase(
  offeringIdentifier: string,
): Promise<{ purchased: boolean; error: string | null }> {
  if (!client) return { purchased: false, error: 'Paywall not configured' };
  try {
    // The SDK exposes packages on the offering — fetch fresh to ensure we
    // pass an actual package object, not just an identifier.
    const offers = await client.getOfferings();
    const pkg = offers.current?.availablePackages.find(
      (p) => p.identifier === offeringIdentifier,
    );
    if (!pkg) return { purchased: false, error: 'Offering not found' };
    const res = await client.purchasePackage(pkg);
    const isActive = !!res.customerInfo.entitlements.active[ENTITLEMENT];
    await refreshState();
    return { purchased: isActive, error: null };
  } catch (e) {
    return {
      purchased: false,
      error: e instanceof Error ? e.message : 'Purchase failed',
    };
  }
}

export async function restorePurchases(): Promise<{ error: string | null }> {
  if (!client) return { error: 'Paywall not configured' };
  try {
    const info = await client.restorePurchases();
    state = {
      ...state,
      isPremium: !!info.entitlements.active[ENTITLEMENT],
    };
    emit();
    return { error: null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Restore failed' };
  }
}
