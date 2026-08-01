import { IGuestSessionPort, IGuestStorePort } from '../../domain/repositories';
import { clearGuestStore, snapshotGuestInvestorProfile } from './guest-storage';
import { savePendingInvestorProfile } from './pending-investor-profile';
import { guestSession } from './guest-session';

export class GuestSessionAdapter implements IGuestSessionPort {
  isActive() {
    return guestSession.isActive();
  }

  activate() {
    guestSession.activate();
  }

  clear() {
    guestSession.clear();
  }
}

export class GuestStoreAdapter implements IGuestStorePort {
  clear() {
    const profile = snapshotGuestInvestorProfile();
    if (profile) savePendingInvestorProfile(profile);
    clearGuestStore();
  }
}

export const guestSessionAdapter = new GuestSessionAdapter();
export const guestStoreAdapter = new GuestStoreAdapter();
