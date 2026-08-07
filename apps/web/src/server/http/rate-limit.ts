import { NextRequest } from 'next/server';
import { AppErrorCode, resolveAppErrorMessage } from '@sar/shared';
import { HttpError } from './errors';

type Bucket = { count: number; resetAt: number };

const memoryBuckets = new Map<string, Bucket>();

export type MarketRateLimitTier = 'light' | 'standard' | 'heavy';

export type AuthRateLimitTier =
  | 'authLogin'
  | 'authRegister'
  | 'authCheckUsername'
  | 'authOAuthStart'
  | 'authOAuthCallback'
  | 'authOAuthProviders'
  | 'authRefresh'
  | 'authLogout'
  | 'authVerifyEmail';

export type ApiRateLimitTier = 'apiRead' | 'apiWrite' | 'apiHeavy';

export type RateLimitTier = MarketRateLimitTier | AuthRateLimitTier | ApiRateLimitTier;

export const TIER_LIMITS: Record<RateLimitTier, { limit: number; windowMs: number }> = {
  light: { limit: 120, windowMs: 60_000 },
  standard: { limit: 60, windowMs: 60_000 },
  heavy: { limit: 12, windowMs: 60_000 },
  authLogin: { limit: 20, windowMs: 60_000 },
  authRegister: { limit: 10, windowMs: 60_000 },
  authCheckUsername: { limit: 30, windowMs: 60_000 },
  authOAuthStart: { limit: 20, windowMs: 60_000 },
  authOAuthCallback: { limit: 30, windowMs: 60_000 },
  authOAuthProviders: { limit: 60, windowMs: 60_000 },
  authRefresh: { limit: 60, windowMs: 60_000 },
  authLogout: { limit: 30, windowMs: 60_000 },
  authVerifyEmail: { limit: 10, windowMs: 60_000 },
  apiRead: { limit: 120, windowMs: 60_000 },
  apiWrite: { limit: 40, windowMs: 60_000 },
  apiHeavy: { limit: 15, windowMs: 60_000 },
};

type UpstashModule = typeof import('@upstash/ratelimit');
type RedisModule = typeof import('@upstash/redis');

let upstashWarned = false;
const upstashLimiters = new Map<RateLimitTier, InstanceType<UpstashModule['Ratelimit']>>();

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown';
  return req.headers.get('x-real-ip') ?? 'unknown';
}

function upstashConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() && process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
  );
}

async function getUpstashLimiter(tier: RateLimitTier) {
  const cached = upstashLimiters.get(tier);
  if (cached) return cached;

  const [{ Ratelimit }, { Redis }] = await Promise.all([
    import('@upstash/ratelimit') as Promise<UpstashModule>,
    import('@upstash/redis') as Promise<RedisModule>,
  ]);

  const { limit, windowMs } = TIER_LIMITS[tier];
  const limiter = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
    prefix: `sar:rl:${tier}`,
  });
  upstashLimiters.set(tier, limiter);
  return limiter;
}

function enforceMemoryRateLimit(key: string, limit: number, windowMs: number): void {
  const now = Date.now();
  const bucket = memoryBuckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    throw new HttpError(resolveAppErrorMessage(AppErrorCode.RATE_LIMIT), 429, AppErrorCode.RATE_LIMIT);
  }
}

async function enforceUpstashRateLimit(key: string, tier: RateLimitTier): Promise<void> {
  const limiter = await getUpstashLimiter(tier);
  const result = await limiter.limit(key);
  if (!result.success) {
    throw new HttpError(resolveAppErrorMessage(AppErrorCode.RATE_LIMIT), 429, AppErrorCode.RATE_LIMIT);
  }
}

/** IP 기준 rate limit — Upstash Redis(선택) 또는 프로세스 메모리 fallback */
export async function enforceRateLimit(
  req: NextRequest,
  scope: string,
  tier: RateLimitTier = 'standard',
): Promise<void> {
  const { limit, windowMs } = TIER_LIMITS[tier];
  const key = `${scope}:${clientIp(req)}`;

  if (upstashConfigured()) {
    await enforceUpstashRateLimit(key, tier);
    return;
  }

  if (process.env.NODE_ENV === 'production' && !upstashWarned) {
    upstashWarned = true;
    console.warn(
      JSON.stringify({
        level: 'warn',
        msg: 'rate limit using in-memory store; set UPSTASH_REDIS_REST_URL/TOKEN for production',
        ts: new Date().toISOString(),
      }),
    );
  }

  enforceMemoryRateLimit(key, limit, windowMs);
}

/** vitest 전용 — rate limit 상태 초기화 */
export function resetRateLimitStoreForTests(): void {
  memoryBuckets.clear();
  upstashLimiters.clear();
  upstashWarned = false;
}
