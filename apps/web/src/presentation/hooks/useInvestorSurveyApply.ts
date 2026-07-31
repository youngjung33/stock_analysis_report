'use client';

import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { PortfolioPreferences } from '@sar/shared';
import { getErrorMessage } from '@/client/domain/errors/app-error';
import { useToast } from '../components/Toast';
import { useServices } from './useServices';
import { invalidatePortfolioLocal } from '../lib/query-config';

export function useInvestorSurveyApply() {
  const { t } = useTranslation();
  const { updatePortfolioPreferencesUseCase } = useServices();
  const queryClient = useQueryClient();
  const { showError, showSuccess } = useToast();
  const [applied, setApplied] = useState(false);
  const [saving, setSaving] = useState(false);

  const applyPreferences = useCallback(
    async (prefs: PortfolioPreferences) => {
      setSaving(true);
      try {
        await updatePortfolioPreferencesUseCase.execute({
          targetKrPercent: prefs.targetKrPercent,
          targetUsPercent: prefs.targetUsPercent,
          maxSingleWeightPercent: prefs.maxSingleWeightPercent,
        });
        await invalidatePortfolioLocal(queryClient);
        setApplied(true);
        showSuccess(t('investorSurvey.applyPrefsDone'));
      } catch (err) {
        showError(getErrorMessage(err, t));
      } finally {
        setSaving(false);
      }
    },
    [queryClient, showError, showSuccess, t, updatePortfolioPreferencesUseCase],
  );

  return { applyPreferences, applied, saving };
}
