const SESSION_KEY = 'sar_guest_session';

export const guestSession = {
  isActive(): boolean {
    if (typeof sessionStorage === 'undefined') return false;
    return sessionStorage.getItem(SESSION_KEY) === '1';
  },

  activate(): void {
    sessionStorage.setItem(SESSION_KEY, '1');
  },

  clear(): void {
    sessionStorage.removeItem(SESSION_KEY);
  },
};
