import jwt from 'jsonwebtoken';

function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

/** env PEM — `\n` 이스케이프 복원 */
export function normalizeApplePrivateKey(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.includes('\\n')) {
    return trimmed.replace(/\\n/g, '\n');
  }
  return trimmed;
}

export function isAppleOAuthConfigured(): boolean {
  return !!(
    env('APPLE_CLIENT_ID') &&
    env('APPLE_TEAM_ID') &&
    env('APPLE_KEY_ID') &&
    env('APPLE_PRIVATE_KEY')
  );
}

/** Apple Sign In client_secret — ES256 JWT (교환 시점마다 생성) */
export function createAppleClientSecret(): string {
  const clientId = env('APPLE_CLIENT_ID');
  const teamId = env('APPLE_TEAM_ID');
  const keyId = env('APPLE_KEY_ID');
  const privateKeyRaw = env('APPLE_PRIVATE_KEY');

  if (!clientId || !teamId || !keyId || !privateKeyRaw) {
    throw new Error('Apple OAuth env is incomplete');
  }

  const privateKey = normalizeApplePrivateKey(privateKeyRaw);

  return jwt.sign({}, privateKey, {
    algorithm: 'ES256',
    expiresIn: '5m',
    issuer: teamId,
    audience: 'https://appleid.apple.com',
    subject: clientId,
    keyid: keyId,
  });
}
