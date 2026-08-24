import { IGuestSessionPort, IGuestStorePort } from '../../domain/repositories';
import { clearGuestStore, snapshotGuestInvestorProfile } from './guest-storage';
import { savePendingInvestorProfile } from '@/client/domain/services/pending-investor-profile';
import { guestSession } from './guest-session';

export class GuestSessionAdapter implements IGuestSessionPort {
  isActive() {
    return guestSession.isActive();
  }

  activate() {
    return guestSession.activate();
  }

  clear() {
    guestSession.clear();
  }

  syncCookie() {
    return guestSession.syncCookie();
  }
}

export class GuestStoreAdapter implements IGuestStorePort {
  clear() {
    clearGuestStore();
  }

  transferProfileAndClear() {
    const profile = snapshotGuestInvestorProfile();
    if (profile) savePendingInvestorProfile(profile);
    clearGuestStore();
  }
}

export const guestSessionAdapter = new GuestSessionAdapter();
export const guestStoreAdapter = new GuestStoreAdapter();
