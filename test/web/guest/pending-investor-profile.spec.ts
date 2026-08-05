/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { createDefaultStoredProfile } from '@sar/shared';
import {
  clearPendingInvestorProfile,
  peekPendingInvestorProfile,
  savePendingInvestorProfile,
  takePendingInvestorProfile,
} from '@/client/domain/services/pending-investor-profile';

describe('pending-investor-profile', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('save and take removes pending profile', () => {
    const profile = createDefaultStoredProfile();
    savePendingInvestorProfile(profile);
    expect(peekPendingInvestorProfile()).toEqual(profile);

    const taken = takePendingInvestorProfile();
    expect(taken).toEqual(profile);
    expect(peekPendingInvestorProfile()).toBeNull();
  });

  it('clearPendingInvestorProfile removes stored profile', () => {
    savePendingInvestorProfile(createDefaultStoredProfile());
    clearPendingInvestorProfile();
    expect(peekPendingInvestorProfile()).toBeNull();
  });

  it('peek does not remove pending profile', () => {
    savePendingInvestorProfile(createDefaultStoredProfile());
    peekPendingInvestorProfile();
    expect(peekPendingInvestorProfile()).not.toBeNull();
  });
});
