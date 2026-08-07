/** OAuth callback redirect URI must stay on the app origin and hit our callback route. */
export function isAllowedOAuthRedirectUri(redirectUri: string, allowedOrigin: string): boolean {
  try {
    const target = new URL(redirectUri.trim());
    const origin = new URL(allowedOrigin).origin;
    if (target.origin !== origin) return false;

    if (target.protocol !== 'https:' && target.protocol !== 'http:') return false;
    if (target.protocol === 'http:' && !isLocalhostHost(target.hostname)) return false;

    return /^\/api\/auth\/oauth\/[^/]+\/callback\/?$/.test(target.pathname);
  } catch {
    return false;
  }
}

function isLocalhostHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}
