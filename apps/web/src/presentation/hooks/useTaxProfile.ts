'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_KOREAN_TAX_PROFILE,
  mapOtherIncomeToBracket,
  type KoreanTaxProfile,
} from '@sar/shared';

const STORAGE_KEY = 'sar_tax_profile';

function normalizeProfile(raw: Partial<KoreanTaxProfile>): KoreanTaxProfile {
  const merged = { ...DEFAULT_KOREAN_TAX_PROFILE, ...raw };
  if (!merged.otherIncomeBracketId && merged.estimatedOtherIncomeKrw) {
    merged.otherIncomeBracketId = mapOtherIncomeToBracket(merged.estimatedOtherIncomeKrw);
  }
  if (!merged.otherIncomeBracketId) {
    merged.otherIncomeBracketId = DEFAULT_KOREAN_TAX_PROFILE.otherIncomeBracketId;
  }
  if (!merged.isaType) merged.isaType = 'none';
  if (merged.isaIncomeSharePercent == null || Number.isNaN(merged.isaIncomeSharePercent)) {
    merged.isaIncomeSharePercent = DEFAULT_KOREAN_TAX_PROFILE.isaIncomeSharePercent;
  }
  if (merged.isaNetIncomeOverrideKrw == null) merged.isaNetIncomeOverrideKrw = 0;
  if (merged.pensionContributionKrw == null) merged.pensionContributionKrw = 0;
  return merged;
}

function readProfile(): KoreanTaxProfile {
  if (typeof localStorage === 'undefined') return { ...DEFAULT_KOREAN_TAX_PROFILE };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_KOREAN_TAX_PROFILE, taxYear: new Date().getFullYear() };
    return normalizeProfile(JSON.parse(raw) as Partial<KoreanTaxProfile>);
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
    const normalized = normalizeProfile(next);
    setProfileState(normalized);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  }, []);

  const updateProfile = useCallback(
    (patch: Partial<KoreanTaxProfile>) => {
      setProfile({ ...readProfile(), ...patch });
    },
    [setProfile],
  );

  return { profile, setProfile, updateProfile };
}
