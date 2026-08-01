import type { StoredInvestorProfile } from '@sar/shared';

const PENDING_KEY = 'sar_pending_investor_profile';

export function savePendingInvestorProfile(profile: StoredInvestorProfile): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(PENDING_KEY, JSON.stringify(profile));
}

export function takePendingInvestorProfile(): StoredInvestorProfile | null {
  if (typeof sessionStorage === 'undefined') return null;
  const raw = sessionStorage.getItem(PENDING_KEY);
  sessionStorage.removeItem(PENDING_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredInvestorProfile;
  } catch {
    return null;
  }
}

export function peekPendingInvestorProfile(): StoredInvestorProfile | null {
  if (typeof sessionStorage === 'undefined') return null;
  const raw = sessionStorage.getItem(PENDING_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredInvestorProfile;
  } catch {
    return null;
  }
}
