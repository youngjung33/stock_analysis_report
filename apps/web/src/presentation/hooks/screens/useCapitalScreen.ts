'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
        showError('금액을 입력해 주세요.');
        return;
      }
      if (Number.isFinite(krw) && krw > 0) {
        await recordCashEntryUseCase.execute({
          currency: 'KRW',
          type: CashLedgerType.INITIAL,
          amount: krw,
          memo: '투자 원금',
        });
      }
      if (Number.isFinite(usd) && usd > 0) {
        await recordCashEntryUseCase.execute({
          currency: 'USD',
          type: CashLedgerType.INITIAL,
          amount: usd,
          memo: '투자 원금 (USD)',
        });
      }
      setKrwAmount('');
      setUsdAmount('');
      showSuccess('투자 원금이 반영되었습니다.');
      await notifyPortfolioChange();
    } catch (err) {
      showError(getErrorMessage(err, '투자 원금 등록에 실패했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeposit(currency: 'KRW' | 'USD') {
    const raw = currency === 'KRW' ? krwAmount : usdAmount;
    const amount = parseAmountInput(raw);
    if (!amount || amount <= 0) {
      showError('금액을 입력해 주세요.');
      return;
    }
    setSaving(true);
    try {
      await recordCashEntryUseCase.execute({
        currency,
        type: CashLedgerType.DEPOSIT,
        amount,
        memo: '입금',
      });
      if (currency === 'KRW') setKrwAmount('');
      else setUsdAmount('');
      showSuccess('입금이 반영되었습니다.');
      await notifyPortfolioChange();
    } catch (err) {
      showError(getErrorMessage(err, '입금에 실패했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleWithdraw(currency: 'KRW' | 'USD') {
    const raw = currency === 'KRW' ? krwAmount : usdAmount;
    const amount = parseAmountInput(raw);
    if (!amount || amount <= 0) {
      showError('금액을 입력해 주세요.');
      return;
    }
    setSaving(true);
    try {
      await recordCashEntryUseCase.execute({
        currency,
        type: CashLedgerType.WITHDRAW,
        amount,
        memo: '출금',
      });
      if (currency === 'KRW') setKrwAmount('');
      else setUsdAmount('');
      showSuccess('출금이 반영되었습니다.');
      await notifyPortfolioChange();
    } catch (err) {
      showError(getErrorMessage(err, '출금에 실패했습니다.'));
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
      showSuccess('목표 비중이 저장되었습니다.');
      await notifyPortfolioChange();
    } catch (err) {
      showError(getErrorMessage(err, '설정 저장에 실패했습니다.'));
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
