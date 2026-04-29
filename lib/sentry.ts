// Sentry crash + performance reporting.
//
// To enable in production:
//   1. `npx expo install sentry-expo @sentry/react-native`
//   2. Set EXPO_PUBLIC_SENTRY_DSN in `.env`
//   3. Wrap RootLayout with `Sentry.wrap(RootLayout)` (see app/_layout.tsx)
//
// Without a DSN, every export below is a no-op so the app stays runnable in
// dev without the Sentry package installed.

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

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
        enableAutoSessionTracking?: boolean;
        tracesSampleRate?: number;
      }) => void;
    };
    Sentry.init({
      dsn: SENTRY_DSN,
      enableAutoSessionTracking: true,
      tracesSampleRate: 0.1,
    });
    client = Sentry;
  } catch {
    // Init failed — stay disabled.
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

export function setSentryUser(
  user: { id: string; email?: string } | null,
): void {
  if (!SENTRY_DSN) return;
  client?.setUser(user);
}
