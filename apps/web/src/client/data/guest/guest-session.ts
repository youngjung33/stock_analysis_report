import { GUEST_SESSION_COOKIE } from '@sar/shared';

const SESSION_KEY = 'sar_guest_session';

async function postGuestSession(): Promise<void> {
  const res = await fetch('/api/auth/guest/session', {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Guest session request failed');
}

async function deleteGuestSession(): Promise<void> {
  await fetch('/api/auth/guest/session', {
    method: 'DELETE',
    credentials: 'include',
  });
}

export const guestSession = {
  isActive(): boolean {
    if (typeof sessionStorage === 'undefined') return false;
    return sessionStorage.getItem(SESSION_KEY) === '1';
  },

  async activate(): Promise<void> {
    await postGuestSession();
    sessionStorage.setItem(SESSION_KEY, '1');
  },

  clear(): void {
    sessionStorage.removeItem(SESSION_KEY);
    void deleteGuestSession();
  },

  /** Restore server cookie after refresh when sessionStorage is still active */
  async syncCookie(): Promise<void> {
    if (!this.isActive()) return;
    try {
      await postGuestSession();
    } catch {
      // sessionStorage remains; user may retry navigation
    }
  },
};

export function clearGuestSessionCookie(): void {
  void deleteGuestSession();
}

export { GUEST_SESSION_COOKIE };
