'use client';

import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_KOREAN_TAX_PROFILE, type KoreanTaxProfile } from '@sar/shared';

const STORAGE_KEY = 'sar_tax_profile';

function readProfile(): KoreanTaxProfile {
  if (typeof localStorage === 'undefined') return { ...DEFAULT_KOREAN_TAX_PROFILE };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_KOREAN_TAX_PROFILE, taxYear: new Date().getFullYear() };
    return { ...DEFAULT_KOREAN_TAX_PROFILE, ...JSON.parse(raw) } as KoreanTaxProfile;
  } catch {
    return { ...DEFAULT_KOREAN_TAX_PROFILE };
  }
}

export function useTaxProfile() {
  const [profile, setProfileState] = useState<KoreanTaxProfile>(() => readProfile());

  useEffect(() => {
    setProfileState(readProfile());
  }, []);

  const setProfile = useCallback((next: KoreanTaxProfile) => {
    setProfileState(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const updateProfile = useCallback((patch: Partial<KoreanTaxProfile>) => {
    setProfile({ ...readProfile(), ...patch });
  }, [setProfile]);

  return { profile, setProfile, updateProfile };
}
