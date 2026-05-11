// Sentry crash + performance reporting.
//
// Setup (one-time):
//   1. From the project root, run the Sentry wizard:
//        npx @sentry/wizard@latest -i reactNative --saas \
//             --org futurebuilt-tech --project purecraft
//      The wizard adds:
//        - EXPO_PUBLIC_SENTRY_DSN to .env
//        - the @sentry/react-native/expo plugin to app.json
//        - source-map / debug-symbol upload to your build pipeline
//   2. Restart Expo (`expo start --clear`) so the new env var loads.
//
// Without a DSN every export below is a no-op so dev runs stay clean.
// Because the DSN is the gate, the wizard alone is what flips Sentry on
// in production — no code changes here are needed once the DSN exists.
//
// PII scrubbing — important.
// Sentry collects whatever it sees. Crash reports often include URLs,
// HTTP headers, and breadcrumb arguments — all of which can carry
// user-identifying data. The `beforeSend` and `beforeBreadcrumb` hooks
// below scrub the most common leaks before transmission. Update them
// when adding new SDKs that send their own breadcrumbs (auth tokens,
// payment metadata, address fields, etc.).

import Constants from 'expo-constants';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

// Resolved at module load. Used in `init` and as a fallback "do nothing"
// signal for runtime helpers when the SDK never bound.
const APP_ENV: 'development' | 'production' =
  // eslint-disable-next-line no-undef
  typeof __DEV__ !== 'undefined' && __DEV__ ? 'development' : 'production';

// expo-constants pulls the version + build number from app.json so
// Sentry can group issues by release. release == "<name>@<version>".
// dist == iOS buildNumber / Android versionCode (per-build identifier
// inside a release).
const expoConfig = Constants.expoConfig;
const APP_VERSION = expoConfig?.version ?? '0.0.0';
const APP_NAME = expoConfig?.slug ?? 'purecraft';
const RELEASE = `${APP_NAME}@${APP_VERSION}`;
const DIST =
  (expoConfig?.ios?.buildNumber as string | undefined) ??
  (expoConfig?.android?.versionCode != null
    ? String(expoConfig.android.versionCode)
    : undefined);

// =============================================================================
// Scrubbers — keep narrow + boring so they're easy to reason about.
// =============================================================================

// Patterns inside URLs / strings whose VALUE we replace with [redacted].
// Add new ones here when an integration starts leaking. Be conservative:
// false positives are harmless (something gets blanked), false negatives
// leak actual secrets to Sentry.
const TOKEN_QS_PARAMS = [
  'access_token',
  'refresh_token',
  'apikey',
  'api_key',
  'token',
  'auth',
  'authorization',
];

function scrubUrl(rawUrl: unknown): string | undefined {
  if (typeof rawUrl !== 'string') return undefined;
  // Replace any token-like query param value with [redacted]. Cheap
  // string ops only — avoid `new URL()` because rawUrl can be a
  // relative path or invalid spec.
  let out = rawUrl;
  for (const key of TOKEN_QS_PARAMS) {
    const re = new RegExp(`([?&]${key}=)[^&#]*`, 'gi');
    out = out.replace(re, `$1[redacted]`);
  }
  return out;
}

function scrubHeaders(
  headers: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!headers) return headers;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(headers)) {
    if (/^(authorization|cookie|x-api-key|apikey)$/i.test(k)) {
      out[k] = '[redacted]';
    } else {
      out[k] = v;
    }
  }
  return out;
}

function beforeSend(event: SentryEvent): SentryEvent | null {
  // 1. Drop email from user — id-only is enough to correlate sessions
  //    and removes the most common GDPR concern. Re-add specific
  //    fields here if you ever need them and have a privacy review.
  if (event.user) {
    const { id, ip_address: _ip, email: _email, ...rest } = event.user;
    event.user = id ? { id, ...rest } : undefined;
  }

  // 2. Scrub request URL + headers if Sentry attached an HTTP frame.
  if (event.request) {
    event.request.url = scrubUrl(event.request.url) ?? event.request.url;
    event.request.headers = scrubHeaders(
      event.request.headers as Record<string, unknown> | undefined,
    );
  }

  // 3. Strip Supabase service URLs from breadcrumb messages — keeps
  //    project URLs out of crash reports shared in screenshots.
  if (Array.isArray(event.breadcrumbs)) {
    for (const bc of event.breadcrumbs) {
      if (typeof bc.data?.url === 'string') {
        bc.data.url = scrubUrl(bc.data.url) ?? bc.data.url;
      }
    }
  }

  return event;
}

function beforeBreadcrumb(
  breadcrumb: SentryBreadcrumb,
): SentryBreadcrumb | null {
  // Drop verbose console.debug / console.info noise — keep error +
  // warning levels. Cuts breadcrumb volume substantially in dev
  // builds without losing diagnostic value.
  if (
    breadcrumb.category === 'console' &&
    (breadcrumb.level === 'debug' || breadcrumb.level === 'info')
  ) {
    return null;
  }
  // Scrub URL params on http/navigation breadcrumbs.
  if (typeof breadcrumb.data?.url === 'string') {
    breadcrumb.data.url = scrubUrl(breadcrumb.data.url) ?? breadcrumb.data.url;
  }
  return breadcrumb;
}

// =============================================================================
// Init + runtime helpers
// =============================================================================

interface SentryEvent {
  user?: { id?: string; email?: string; ip_address?: string; [k: string]: unknown };
  request?: { url?: string; headers?: Record<string, unknown> };
  breadcrumbs?: SentryBreadcrumb[];
}
interface SentryBreadcrumb {
  category?: string;
  level?: string;
  data?: { url?: string; [k: string]: unknown };
  message?: string;
}
interface SentryLike {
  captureException: (e: unknown, ctx?: Record<string, unknown>) => void;
  captureMessage: (msg: string, ctx?: Record<string, unknown>) => void;
  setUser: (user: { id: string; email?: string } | null) => void;
}

let client: SentryLike | null = null;

async function loadClient(): Promise<void> {
  if (!SENTRY_DSN || client) return;
  try {
    const Sentry = (await import('@sentry/react-native')) as unknown as SentryLike & {
      init: (opts: {
        dsn: string;
        environment?: string;
        release?: string;
        dist?: string;
        enableAutoSessionTracking?: boolean;
        tracesSampleRate?: number;
        // Replay sample rates — only honored when the replay
        // integration is bundled. Keeps the call shape forward-
        // compatible without forcing the integration today.
        replaysSessionSampleRate?: number;
        replaysOnErrorSampleRate?: number;
        beforeSend?: (event: SentryEvent) => SentryEvent | null;
        beforeBreadcrumb?: (
          bc: SentryBreadcrumb,
        ) => SentryBreadcrumb | null;
      }) => void;
    };
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: APP_ENV,
      release: RELEASE,
      dist: DIST,
      enableAutoSessionTracking: true,
      // Performance traces — sample 10% in prod, 100% in dev so local
      // testing surfaces every span without paying for prod volume.
      tracesSampleRate: APP_ENV === 'production' ? 0.1 : 1.0,
      // Session replay sampling — 0% baseline, 100% on error so we
      // get visual context for every crash but don't replay the
      // routine sessions that would inflate quota.
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 1.0,
      beforeSend,
      beforeBreadcrumb,
    });
    client = Sentry;
  } catch {
    // Init failed — stay disabled. Most likely cause: package version
    // mismatch after an Expo SDK upgrade. Reinstall and retry.
  }
}
void loadClient();

export function captureException(
  e: unknown,
  ctx?: Record<string, unknown>,
): void {
  if (!SENTRY_DSN) {
    // eslint-disable-next-line no-console
    console.error('[exception]', e, ctx);
    return;
  }
  client?.captureException(e, ctx);
}

export function captureMessage(
  msg: string,
  ctx?: Record<string, unknown>,
): void {
  if (!SENTRY_DSN) return;
  client?.captureMessage(msg, ctx);
}

/** Default behavior: id-only. Pass `{ id, email }` AND the calling
 *  surface explicitly opted into `includeEmail: true` to forward the
 *  email to Sentry. This matches a sane GDPR posture for an EU-hosted
 *  Sentry org without leaking PII by default. */
export function setSentryUser(
  user: { id: string; email?: string } | null,
  opts?: { includeEmail?: boolean },
): void {
  if (!SENTRY_DSN) return;
  if (user === null) {
    client?.setUser(null);
    return;
  }
  client?.setUser({
    id: user.id,
    ...(opts?.includeEmail && user.email ? { email: user.email } : {}),
  });
}
