import { NextResponse } from 'next/server';
import { AppErrorCode, resolveAppErrorMessage } from '@sar/shared';
import { HttpError } from './errors';
import { handleRouteError } from './route-error';
import { deadlineFromMaxDuration, readApiRouteDeadlineMs } from './request-timeouts';

export type RunApiRouteOptions = {
  /** Match route `export const maxDuration` (seconds) when set */
  maxDurationSec?: number;
  deadlineMs?: number;
  onError?: (error: unknown) => NextResponse;
};

function routeTimeoutError(): HttpError {
  return new HttpError(
    resolveAppErrorMessage(AppErrorCode.REQUEST_TIMEOUT),
    504,
    AppErrorCode.REQUEST_TIMEOUT,
  );
}

async function withRouteDeadline<T>(deadlineMs: number, fn: () => Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      fn(),
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(routeTimeoutError()), deadlineMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function resolveDeadlineMs(options?: RunApiRouteOptions): number {
  if (options?.deadlineMs != null) return options.deadlineMs;
  if (options?.maxDurationSec != null) return deadlineFromMaxDuration(options.maxDurationSec);
  return readApiRouteDeadlineMs();
}

/**
 * API route entry — try/catch, `handleRouteError`, and wall-clock deadline (cron routes excluded).
 */
export async function runApiRoute(
  handler: () => Promise<NextResponse>,
  options?: RunApiRouteOptions,
): Promise<NextResponse> {
  const deadlineMs = resolveDeadlineMs(options);
  try {
    return await withRouteDeadline(deadlineMs, handler);
  } catch (error) {
    if (options?.onError) return options.onError(error);
    return handleRouteError(error);
  }
}
