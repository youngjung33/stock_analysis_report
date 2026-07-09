(function initSentryServer() {
  const sentryDsn = process.env.SENTRY_DSN?.trim();
  if (!sentryDsn) return;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Sentry = require('@sentry/nextjs');
  Sentry.init({
    dsn: sentryDsn,
    tracesSampleRate: 0.1,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  });
})();

export {};
