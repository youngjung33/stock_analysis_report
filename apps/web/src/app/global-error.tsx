'use client';

import { useEffect } from 'react';

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
    <html lang="ko">
      <body className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-slate-200">
        <h1 className="text-lg font-semibold">문제가 발생했습니다</h1>
        <p className="mt-2 text-sm text-slate-400">잠시 후 다시 시도해 주세요.</p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          다시 시도
        </button>
      </body>
    </html>
  );
}
