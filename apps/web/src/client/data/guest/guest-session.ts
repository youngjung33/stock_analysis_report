import { GUEST_SESSION_COOKIE } from '@sar/shared';

const SESSION_KEY = 'sar_guest_session';

function setGuestCookie(active: boolean): void {
  if (typeof document === 'undefined') return;
  if (active) {
    document.cookie = `${GUEST_SESSION_COOKIE}=1; path=/; SameSite=Lax`;
  } else {
    document.cookie = `${GUEST_SESSION_COOKIE}=; path=/; Max-Age=0; SameSite=Lax`;
  }
}

export const guestSession = {
  isActive(): boolean {
    if (typeof sessionStorage === 'undefined') return false;
    return sessionStorage.getItem(SESSION_KEY) === '1';
  },

  activate(): void {
    sessionStorage.setItem(SESSION_KEY, '1');
    setGuestCookie(true);
  },

  clear(): void {
    sessionStorage.removeItem(SESSION_KEY);
    setGuestCookie(false);
  },

  /** Restore cookie after refresh when sessionStorage is still active */
  syncCookie(): void {
    if (this.isActive()) setGuestCookie(true);
  },
};

export function clearGuestSessionCookie(): void {
  setGuestCookie(false);
}
