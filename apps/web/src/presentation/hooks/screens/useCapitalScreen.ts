'use client';

import { useCallback, useEffect, useState } from 'react';
import { CashLedgerType, formatCashAmount, parseAmountInput } from '@sar/shared';
import { getErrorMessage } from '@/client/domain/errors/app-error';
import { useToast } from '../../components/Toast';
import { useServices } from '../useServices';

export function useCapitalScreen(onUpdated?: () => void) {
  const {
    getCashSummaryUseCase,
    recordCashEntryUseCase,
    getPortfolioPreferencesUseCase,
    updatePortfolioPreferencesUseCase,
    getPortfolioSimulationUseCase,
  } = useServices();
  const { showError, showSuccess } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [krwAmount, setKrwAmount] = useState('');
  const [usdAmount, setUsdAmount] = useState('');
  const [cashKrw, setCashKrw] = useState(0);
  const [cashUsd, setCashUsd] = useState(0);
  const [targetKr, setTargetKr] = useState(70);
  const [targetUs, setTargetUs] = useState(30);
  const [maxWeight, setMaxWeight] = useState(40);
  const [simulation, setSimulation] = useState<
    Awaited<ReturnType<typeof getPortfolioSimulationUseCase.execute>> | null
  >(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [cash, prefs, sim] = await Promise.all([
        getCashSummaryUseCase.execute(),
        getPortfolioPreferencesUseCase.execute(),
        getPortfolioSimulationUseCase.execute(),
      ]);
      setCashKrw(cash.balances.krw);
      setCashUsd(cash.balances.usd);
      setTargetKr(prefs.targetKrPercent);
      setTargetUs(prefs.targetUsPercent);
      setMaxWeight(prefs.maxSingleWeightPercent);
      setSimulation(sim);
    } catch (err) {
      showError(getErrorMessage(err, '자본 정보를 불러오지 못했습니다.'));
    } finally {
      setLoading(false);
    }
  }, [
    getCashSummaryUseCase,
    getPortfolioPreferencesUseCase,
    getPortfolioSimulationUseCase,
    showError,
  ]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function handleInitialCapital(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const krw = parseAmountInput(krwAmount);
      const usd = parseAmountInput(usdAmount);
      if (krw > 0) {
        await recordCashEntryUseCase.execute({
          currency: 'KRW',
          type: CashLedgerType.INITIAL,
          amount: krw,
          memo: '초기 자본금',
        });
      }
      if (usd > 0) {
        await recordCashEntryUseCase.execute({
          currency: 'USD',
          type: CashLedgerType.INITIAL,
          amount: usd,
          memo: '초기 자본금 (USD)',
        });
      }
      setKrwAmount('');
      setUsdAmount('');
      showSuccess('자본금이 반영되었습니다.');
      await reload();
      onUpdated?.();
    } catch (err) {
      showError(getErrorMessage(err, '자본금 등록에 실패했습니다.'));
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
      await reload();
      onUpdated?.();
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
      await reload();
      onUpdated?.();
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
      await reload();
      onUpdated?.();
    } catch (err) {
      showError(getErrorMessage(err, '설정 저장에 실패했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  return {
    loading,
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
    simulation,
    handleInitialCapital,
    handleDeposit,
    handleWithdraw,
    handleSavePreferences,
    reload,
  };
}
