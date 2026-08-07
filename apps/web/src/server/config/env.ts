const REQUIRED_ENV = ['JWT_ACCESS_SECRET', 'DATABASE_URL'] as const;

const OPTIONAL_BUT_RECOMMENDED = [
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
] as const;

export function validateServerEnv(): void {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const secret = process.env.JWT_ACCESS_SECRET?.trim() ?? '';
  if (secret.length < 32) {
    throw new Error('JWT_ACCESS_SECRET must be at least 32 characters');
  }

  if (process.env.NODE_ENV === 'production') {
    const missingRecommended = OPTIONAL_BUT_RECOMMENDED.filter((key) => !process.env[key]?.trim());
    if (missingRecommended.length > 0) {
      console.warn(
        JSON.stringify({
          level: 'warn',
          msg: 'recommended env vars missing for production hardening',
          keys: missingRecommended,
          ts: new Date().toISOString(),
        }),
      );
    }
  }
}

export function resolveGuestSessionSecret(): string {
  const dedicated = process.env.GUEST_SESSION_SECRET?.trim();
  if (dedicated) return dedicated;
  return process.env.JWT_ACCESS_SECRET!.trim();
}
