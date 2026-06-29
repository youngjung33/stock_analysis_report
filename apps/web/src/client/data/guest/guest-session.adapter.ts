import { IGuestSessionPort, IGuestStorePort } from '../../domain/repositories';
import { clearGuestStore } from './guest-storage';
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
    clearGuestStore();
  }
}

export const guestSessionAdapter = new GuestSessionAdapter();
export const guestStoreAdapter = new GuestStoreAdapter();
