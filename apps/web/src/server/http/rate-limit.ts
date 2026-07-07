import { NextRequest } from 'next/server';
import { AppErrorCode, resolveAppErrorMessage } from '@sar/shared';
import { HttpError } from './errors';

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type MarketRateLimitTier = 'light' | 'standard' | 'heavy';

export type AuthRateLimitTier = 'authLogin' | 'authRegister' | 'authCheckUsername' | 'authOAuthStart';

export type RateLimitTier = MarketRateLimitTier | AuthRateLimitTier;

const TIER_LIMITS: Record<RateLimitTier, { limit: number; windowMs: number }> = {
  light: { limit: 120, windowMs: 60_000 },
  standard: { limit: 60, windowMs: 60_000 },
  heavy: { limit: 12, windowMs: 60_000 },
  authLogin: { limit: 20, windowMs: 60_000 },
  authRegister: { limit: 10, windowMs: 60_000 },
  authCheckUsername: { limit: 30, windowMs: 60_000 },
  authOAuthStart: { limit: 20, windowMs: 60_000 },
};

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown';
  return req.headers.get('x-real-ip') ?? 'unknown';
}

/** IP 기준 슬라이딩 윈도 rate limit — 초과 시 429 */
export function enforceRateLimit(
  req: NextRequest,
  scope: string,
  tier: RateLimitTier = 'standard',
): void {
  const { limit, windowMs } = TIER_LIMITS[tier];
  const key = `${scope}:${clientIp(req)}`;
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    throw new HttpError(resolveAppErrorMessage(AppErrorCode.RATE_LIMIT), 429, AppErrorCode.RATE_LIMIT);
  }
}

/** vitest 전용 — rate limit 상태 초기화 */
export function resetRateLimitStoreForTests(): void {
  buckets.clear();
}
