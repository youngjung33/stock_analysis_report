const GUEST_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function signHmacSha256(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return base64UrlEncode(new Uint8Array(sig));
}

/** HttpOnly guest session cookie value (HMAC-signed, edge-safe). */
export async function issueGuestSessionToken(secret: string, now = Date.now()): Promise<string> {
  const payload = base64UrlEncode(
    new TextEncoder().encode(JSON.stringify({ v: 1, exp: now + GUEST_TOKEN_TTL_MS })),
  );
  const sig = await signHmacSha256(secret, payload);
  return `${payload}.${sig}`;
}

export async function verifyGuestSessionToken(
  token: string,
  secret: string,
  now = Date.now(),
): Promise<boolean> {
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;

  const expected = await signHmacSha256(secret, payload);
  if (!timingSafeEqual(sig, expected)) return false;

  try {
    const json = JSON.parse(new TextDecoder().decode(base64UrlDecode(payload))) as {
      v?: number;
      exp?: number;
    };
    return json.v === 1 && typeof json.exp === 'number' && json.exp > now;
  } catch {
    return false;
  }
}
