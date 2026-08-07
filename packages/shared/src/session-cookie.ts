/** Opaque refresh tokens are 64-byte hex strings from the auth layer. */
export function isPlausibleRefreshToken(value: string | undefined | null): boolean {
  return typeof value === 'string' && /^[a-f0-9]{128}$/i.test(value);
}

/** Decode JWT exp without signature verification — middleware UX gate only. */
export function isJwtNotExpired(token: string | undefined | null, now = Date.now()): boolean {
  if (!token) return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payloadPart = parts[1];
    if (!payloadPart) return false;
    const padded = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const json = JSON.parse(atob(padded)) as { exp?: number };
    return typeof json.exp === 'number' && json.exp * 1000 > now;
  } catch {
    return false;
  }
}
