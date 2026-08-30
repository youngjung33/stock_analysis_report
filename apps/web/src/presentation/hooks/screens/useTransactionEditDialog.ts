'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { parseAmountInput } from '@sar/shared';
import { Transaction } from '@/client/domain/models';
import { getErrorMessage } from '@/client/domain/errors/app-error';
import { useToast } from '../../components/Toast';
import { useServices } from '../useServices';

export function useTransactionEditDialog(
  transaction: Transaction | null,
  onClose: () => void,
  onSuccess: () => void,
) {
  const { t } = useTranslation();
  const { updateTransactionUseCase } = useServices();
  const { showError, showSuccess } = useToast();
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [commission, setCommission] = useState('');
  const [tradedAt, setTradedAt] = useState('');
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!transaction) return;
    setQuantity(String(transaction.quantity));
    setPrice(String(transaction.price));
    setCommission(
      transaction.commission && transaction.commission > 0 ? String(transaction.commission) : '',
    );
    setTradedAt(transaction.tradedAt.slice(0, 10));
    setMemo(transaction.memo ?? '');
  }, [transaction]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!transaction) return;

    setLoading(true);
    try {
      await updateTransactionUseCase.execute(transaction.id, {
        quantity: Number(quantity),
        price: parseAmountInput(price),
        commission: commission.trim() ? parseAmountInput(commission) : undefined,
        tradedAt: new Date(tradedAt).toISOString(),
        memo: memo || undefined,
      });
      showSuccess(t('transactions.toast.updated'));
      onSuccess();
      onClose();
    } catch (err) {
      showError(getErrorMessage(err, t('transactions.toast.updateFailed')));
    } finally {
      setLoading(false);
    }
  }

  return {
    quantity,
    setQuantity,
    price,
    setPrice,
    commission,
    setCommission,
    tradedAt,
    setTradedAt,
    memo,
    setMemo,
    loading,
    handleSubmit,
  };
}
