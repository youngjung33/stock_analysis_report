'use client';

import { useEffect } from 'react';
import i18n from '@/i18n/config';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const dsn =
      process.env.NEXT_PUBLIC_SENTRY_DSN?.trim() ?? process.env.SENTRY_DSN?.trim();
    if (!dsn) return;

    void import('@sentry/nextjs').then((Sentry) => {
      Sentry.captureException(error);
    });
  }, [error]);

  return (
    <html lang={i18n.language}>
      <body className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-slate-200">
        <h1 className="text-lg font-semibold">{i18n.t('pages.globalError.title')}</h1>
        <p className="mt-2 text-sm text-slate-400">{i18n.t('pages.globalError.message')}</p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          {i18n.t('pages.globalError.retry')}
        </button>
      </body>
    </html>
  );
}
