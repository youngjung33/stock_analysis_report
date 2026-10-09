function clampMs(raw: string | undefined, fallback: number, min: number, max: number): number {
  const n = raw != null ? Number(raw) : NaN;
  const value = Number.isFinite(n) && n > 0 ? n : fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

/** Outbound `fetch` (Yahoo, DART, OAuth, email, …) — default 12s */
export function readOutboundFetchTimeoutMs(): number {
  return clampMs(process.env.OUTBOUND_FETCH_TIMEOUT_MS, 12_000, 3_000, 60_000);
}

/** Default API route wall-clock deadline when `maxDuration` is not set — default 24s */
export function readApiRouteDeadlineMs(): number {
  return clampMs(process.env.API_ROUTE_DEADLINE_MS, 24_000, 5_000, 120_000);
}

/** Slightly below platform `maxDuration` so JSON 504 returns before hard kill */
export function deadlineFromMaxDuration(maxDurationSec?: number): number {
  if (maxDurationSec == null || !Number.isFinite(maxDurationSec) || maxDurationSec <= 0) {
    return readApiRouteDeadlineMs();
  }
  const platformMs = maxDurationSec * 1000;
  const bufferMs = 1_000;
  return Math.max(5_000, platformMs - bufferMs);
}

/** Browser axios client — default 30s */
export function readApiClientTimeoutMs(): number {
  return clampMs(process.env.NEXT_PUBLIC_API_CLIENT_TIMEOUT_MS, 30_000, 5_000, 120_000);
}
