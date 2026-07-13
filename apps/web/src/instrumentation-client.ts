import * as Sentry from '@sentry/nextjs';

const sentryDsn =
  process.env.NEXT_PUBLIC_SENTRY_DSN?.trim() ?? process.env.SENTRY_DSN?.trim();

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    tracesSampleRate: 0.1,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
