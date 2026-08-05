export const GUEST_SESSION_COOKIE = 'sarGuestSession';

/** Pages reachable without refresh token or guest session cookie */
export const PUBLIC_PAGE_PATHS = ['/login', '/forgot-password', '/reset-password'] as const;

export function normalizePagePath(pathname: string): string {
  const path = pathname.split('?')[0] ?? '/';
  if (path.length > 1 && path.endsWith('/')) return path.slice(0, -1);
  return path;
}

export function isPublicPagePath(pathname: string): boolean {
  return (PUBLIC_PAGE_PATHS as readonly string[]).includes(normalizePagePath(pathname));
}

export function hasAppSessionCookie(cookies: {
  get(name: string): { value: string } | undefined;
}): boolean {
  if (cookies.get('refreshToken')?.value) return true;
  return cookies.get(GUEST_SESSION_COOKIE)?.value === '1';
}
