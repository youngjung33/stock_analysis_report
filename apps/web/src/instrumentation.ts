export async function register() {
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) return;

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.server.config');
  }
}

export const onRequestError = async (
  err: Error,
  request: { path: string; method: string },
  context: { routerKind: string; routePath: string },
) => {
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) return;

  const Sentry = await import('@sentry/nextjs');
  Sentry.captureException(err, {
    extra: {
      path: request.path,
      method: request.method,
      routerKind: context.routerKind,
      routePath: context.routePath,
    },
  });
};
