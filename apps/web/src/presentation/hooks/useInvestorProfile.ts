'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  buildInvestorProfile,
  clampAdjustmentPercent,
  createDefaultStoredProfile,
  upsertTestScore,
  type AnalysisTestId,
  type BuiltInvestorProfile,
  type StoredInvestorProfile,
  type TestScoreEntry,
} from '@sar/shared';
import {
  hydrateStoredProfile,
  normalizeStoredProfile,
} from '@/client/data/investor-profile-hydrate';
import {
  getGuestInvestorProfile,
  saveGuestInvestorProfile,
  saveGuestPortfolioPreference,
} from '@/client/data/guest/guest-storage';
import {
  peekPendingInvestorProfile,
  takePendingInvestorProfile,
} from '@/client/data/guest/pending-investor-profile';
import { invalidatePortfolioLocal, MARKET_QUERY_KEYS } from '../lib/query-config';
import { useAuth } from './useAuth';
import { useServices } from './useServices';

function loadGuestStoredProfile(): StoredInvestorProfile {
  return normalizeStoredProfile(getGuestInvestorProfile());
}

export function useInvestorProfile() {
  const { isGuest } = useAuth();
  const { getPortfolioPreferencesUseCase, updatePortfolioPreferencesUseCase } = useServices();
  const queryClient = useQueryClient();
  const pendingTransferDone = useRef(false);

  const [stored, setStored] = useState<StoredInvestorProfile>(() =>
    isGuest ? loadGuestStoredProfile() : createDefaultStoredProfile(),
  );
  const [loading, setLoading] = useState(!isGuest);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState({
    targetKrPercent: 70,
    targetUsPercent: 30,
    maxSingleWeightPercent: 40,
  });

  const profile: BuiltInvestorProfile = useMemo(() => buildInvestorProfile(stored), [stored]);

  const refresh = useCallback(async () => {
    if (isGuest) {
      // Guest ledger lives in sessionStorage only — do not pull from shared localStorage.
      setStored(loadGuestStoredProfile());
      return;
    }

    setLoading(true);
    try {
      const data = await getPortfolioPreferencesUseCase.execute();
      setPrefs({
        targetKrPercent: data.targetKrPercent,
        targetUsPercent: data.targetUsPercent,
        maxSingleWeightPercent: data.maxSingleWeightPercent,
      });

      let nextStored = normalizeStoredProfile(data.investorProfile);
      nextStored = hydrateStoredProfile(nextStored, { fromLocalAnswers: true });

      const pending = peekPendingInvestorProfile();
      if (pending && !data.investorProfile && !pendingTransferDone.current) {
        pendingTransferDone.current = true;
        nextStored = hydrateStoredProfile(normalizeStoredProfile(pending), { fromLocalAnswers: true });
        takePendingInvestorProfile();
        await updatePortfolioPreferencesUseCase.execute({
          targetKrPercent: data.targetKrPercent,
          targetUsPercent: data.targetUsPercent,
          maxSingleWeightPercent: data.maxSingleWeightPercent,
          investorProfile: nextStored,
        });
        await invalidatePortfolioLocal(queryClient);
      }

      setStored(nextStored);
    } finally {
      setLoading(false);
    }
  }, [getPortfolioPreferencesUseCase, isGuest, queryClient, updatePortfolioPreferencesUseCase]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const persistStored = useCallback(
    async (nextStored: StoredInvestorProfile, nextPrefs = prefs) => {
      setSaving(true);
      try {
        if (isGuest) {
          saveGuestInvestorProfile(nextStored);
          saveGuestPortfolioPreference({
            targetKrPercent: nextPrefs.targetKrPercent,
            targetUsPercent: nextPrefs.targetUsPercent,
            maxSingleWeightPercent: nextPrefs.maxSingleWeightPercent,
          });
          setStored(nextStored);
          return;
        }
        await updatePortfolioPreferencesUseCase.execute({
          ...nextPrefs,
          investorProfile: nextStored,
        });
        setStored(nextStored);
        await invalidatePortfolioLocal(queryClient);
      } finally {
        setSaving(false);
      }
    },
    [isGuest, prefs, queryClient, updatePortfolioPreferencesUseCase],
  );

  const upsertTestScoreEntry = useCallback(
    async (entry: TestScoreEntry) => {
      const nextLedger = upsertTestScore(stored.ledger, entry);
      const nextStored: StoredInvestorProfile = {
        ...stored,
        ledger: nextLedger,
        updatedAt: new Date().toISOString(),
      };
      const built = buildInvestorProfile(nextStored);
      const nextPrefs = {
        targetKrPercent: built.preferences.targetKrPercent,
        targetUsPercent: built.preferences.targetUsPercent,
        maxSingleWeightPercent: built.preferences.maxSingleWeightPercent,
      };
      setPrefs(nextPrefs);
      await persistStored(nextStored, nextPrefs);
      return built;
    },
    [persistStored, stored],
  );

  const setAdjustmentPercent = useCallback(
    async (value: number) => {
      const nextStored: StoredInvestorProfile = {
        ...stored,
        adjustmentPercent: clampAdjustmentPercent(value),
        updatedAt: new Date().toISOString(),
      };
      await persistStored(nextStored);
    },
    [persistStored, stored],
  );

  const saveManualPreferences = useCallback(
    async (manualPrefs: {
      targetKrPercent: number;
      targetUsPercent: number;
      maxSingleWeightPercent: number;
    }) => {
      setPrefs(manualPrefs);
      await persistStored(stored, manualPrefs);
    },
    [persistStored, stored],
  );

  const wasSlotUpdated = useCallback(
    (testId: AnalysisTestId) => Boolean(stored.ledger.entries[testId]),
    [stored.ledger.entries],
  );

  return {
    profile,
    stored,
    prefs,
    loading,
    saving,
    refresh,
    upsertTestScoreEntry,
    setAdjustmentPercent,
    saveManualPreferences,
    wasSlotUpdated,
    setPrefs,
  };
}
