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
  getGuestPortfolioPreference,
  saveGuestInvestorProfile,
  saveGuestPortfolioPreference,
} from '@/client/data/guest/guest-storage';
import {
  peekPendingInvestorProfile,
  takePendingInvestorProfile,
} from '@/client/data/guest/pending-investor-profile';
import { invalidatePortfolioLocal } from '../lib/query-config';
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
      const guestPrefs = getGuestPortfolioPreference();
      setPrefs({
        targetKrPercent: guestPrefs.targetKrPercent,
        targetUsPercent: guestPrefs.targetUsPercent,
        maxSingleWeightPercent: guestPrefs.maxSingleWeightPercent,
      });
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

      const dbStored = normalizeStoredProfile(data.investorProfile);
      let nextStored = hydrateStoredProfile(dbStored, { fromLocalAnswers: true });
      const hydrateChanged =
        JSON.stringify(nextStored.ledger.entries) !== JSON.stringify(dbStored.ledger.entries);

      const pending = peekPendingInvestorProfile();
      if (pending && !data.investorProfile && !pendingTransferDone.current) {
        const merged = hydrateStoredProfile(normalizeStoredProfile(pending), {
          fromLocalAnswers: true,
        });
        try {
          await updatePortfolioPreferencesUseCase.execute({
            targetKrPercent: data.targetKrPercent,
            targetUsPercent: data.targetUsPercent,
            maxSingleWeightPercent: data.maxSingleWeightPercent,
            investorProfile: merged,
          });
          takePendingInvestorProfile();
          pendingTransferDone.current = true;
          nextStored = merged;
          await invalidatePortfolioLocal(queryClient);
        } catch {
          // pending 유지 — 다음 refresh에서 재시도
        }
      } else if (hydrateChanged) {
        try {
          await updatePortfolioPreferencesUseCase.execute({
            targetKrPercent: data.targetKrPercent,
            targetUsPercent: data.targetUsPercent,
            maxSingleWeightPercent: data.maxSingleWeightPercent,
            investorProfile: nextStored,
          });
          await invalidatePortfolioLocal(queryClient);
        } catch {
          // 로컬 hydrate 상태는 UI에 반영 — DB 동기화는 다음 persist 시 재시도
        }
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
      await persistStored(nextStored);
      return buildInvestorProfile(nextStored);
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
