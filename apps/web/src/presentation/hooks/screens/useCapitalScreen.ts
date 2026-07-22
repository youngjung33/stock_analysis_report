'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { CashLedgerType, formatCashAmount, parseAmountInput } from '@sar/shared';
import { getErrorMessage } from '@/client/domain/errors/app-error';
import { useToast } from '../../components/Toast';
import { useServices } from '../useServices';
import {
  useCashSummary,
  usePortfolioPreferences,
  usePortfolioSimulation,
} from '../usePortfolioCapital';
import { invalidatePortfolioLocal } from '../../lib/query-config';

export function useCapitalScreen(onUpdated?: () => void) {
  const { t } = useTranslation();
  const { recordCashEntryUseCase, updatePortfolioPreferencesUseCase } = useServices();
  const queryClient = useQueryClient();
  const { showError, showSuccess } = useToast();

  const cashQuery = useCashSummary();
  const prefsQuery = usePortfolioPreferences();
  const simQuery = usePortfolioSimulation();

  const [saving, setSaving] = useState(false);
  const [krwAmount, setKrwAmount] = useState('');
  const [usdAmount, setUsdAmount] = useState('');
  const [targetKr, setTargetKr] = useState(70);
  const [targetUs, setTargetUs] = useState(30);
  const [maxWeight, setMaxWeight] = useState(40);

  const cashKrw = cashQuery.data?.balances.krw ?? 0;
  const cashUsd = cashQuery.data?.balances.usd ?? 0;
  const loading = cashQuery.isLoading || prefsQuery.isLoading;
  const refreshing =
    cashQuery.isFetching || prefsQuery.isFetching || simQuery.isFetching;

  useEffect(() => {
    if (!prefsQuery.data) return;
    setTargetKr(prefsQuery.data.targetKrPercent);
    setTargetUs(prefsQuery.data.targetUsPercent);
    setMaxWeight(prefsQuery.data.maxSingleWeightPercent);
  }, [prefsQuery.data]);

  async function notifyPortfolioChange() {
    await invalidatePortfolioLocal(queryClient);
    onUpdated?.();
  }

  async function handleInitialCapital(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const krw = parseAmountInput(krwAmount);
      const usd = parseAmountInput(usdAmount);
      if ((!Number.isFinite(krw) || krw <= 0) && (!Number.isFinite(usd) || usd <= 0)) {
        showError(t('common.amountRequired'));
        return;
      }
      if (Number.isFinite(krw) && krw > 0) {
        await recordCashEntryUseCase.execute({
          currency: 'KRW',
          type: CashLedgerType.INITIAL,
          amount: krw,
          memo: t('capital.memoInitialCapital'),
        });
      }
      if (Number.isFinite(usd) && usd > 0) {
        await recordCashEntryUseCase.execute({
          currency: 'USD',
          type: CashLedgerType.INITIAL,
          amount: usd,
          memo: t('capital.memoInitialCapitalUsd'),
        });
      }
      setKrwAmount('');
      setUsdAmount('');
      showSuccess(t('capital.toast.capitalSet'));
      await notifyPortfolioChange();
    } catch (err) {
      showError(getErrorMessage(err, t('capital.toast.capitalSetFailed')));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeposit(currency: 'KRW' | 'USD') {
    const raw = currency === 'KRW' ? krwAmount : usdAmount;
    const amount = parseAmountInput(raw);
    if (!amount || amount <= 0) {
      showError(t('common.amountRequired'));
      return;
    }
    setSaving(true);
    try {
      await recordCashEntryUseCase.execute({
        currency,
        type: CashLedgerType.DEPOSIT,
        amount,
        memo: t('capital.memoDeposit'),
      });
      if (currency === 'KRW') setKrwAmount('');
      else setUsdAmount('');
      showSuccess(t('capital.toast.depositSuccess'));
      await notifyPortfolioChange();
    } catch (err) {
      showError(getErrorMessage(err, t('capital.toast.depositFailed')));
    } finally {
      setSaving(false);
    }
  }

  async function handleWithdraw(currency: 'KRW' | 'USD') {
    const raw = currency === 'KRW' ? krwAmount : usdAmount;
    const amount = parseAmountInput(raw);
    if (!amount || amount <= 0) {
      showError(t('common.amountRequired'));
      return;
    }
    setSaving(true);
    try {
      await recordCashEntryUseCase.execute({
        currency,
        type: CashLedgerType.WITHDRAW,
        amount,
        memo: t('capital.memoWithdraw'),
      });
      if (currency === 'KRW') setKrwAmount('');
      else setUsdAmount('');
      showSuccess(t('capital.toast.withdrawSuccess'));
      await notifyPortfolioChange();
    } catch (err) {
      showError(getErrorMessage(err, t('capital.toast.withdrawFailed')));
    } finally {
      setSaving(false);
    }
  }

  async function handleSavePreferences(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updatePortfolioPreferencesUseCase.execute({
        targetKrPercent: targetKr,
        targetUsPercent: targetUs,
        maxSingleWeightPercent: maxWeight,
      });
      showSuccess(t('capital.toast.targetSaved'));
      await notifyPortfolioChange();
    } catch (err) {
      showError(getErrorMessage(err, t('capital.toast.targetSaveFailed')));
    } finally {
      setSaving(false);
    }
  }

  return {
    loading,
    refreshing,
    saving,
    cashKrw,
    cashUsd,
    cashLabelKrw: formatCashAmount(cashKrw, 'KRW'),
    cashLabelUsd: formatCashAmount(cashUsd, 'USD'),
    krwAmount,
    setKrwAmount,
    usdAmount,
    setUsdAmount,
    targetKr,
    setTargetKr,
    targetUs,
    setTargetUs,
    maxWeight,
    setMaxWeight,
    simulation: simQuery.data ?? null,
    handleInitialCapital,
    handleDeposit,
    handleWithdraw,
    handleSavePreferences,
  };
}
