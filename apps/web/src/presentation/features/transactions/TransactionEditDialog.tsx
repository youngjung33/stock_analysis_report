'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { parseAmountInput } from '@sar/shared';
import { Transaction } from '@/client/domain/models';
import { getErrorMessage } from '@/client/domain/errors/app-error';
import { useToast } from '../../components/Toast';
import { useServices } from '../../hooks/useServices';
import { AmountInput } from '../../shared/AmountInput';

interface Props {
  transaction: Transaction | null;
  onClose: () => void;
  onSuccess: () => void;
}

/** 거래 수정 모달 — 수량·단가·일자·메모 */
export function TransactionEditDialog({ transaction, onClose, onSuccess }: Props) {
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

  if (!transaction) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await updateTransactionUseCase.execute(transaction!.id, {
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tx-edit-title"
    >
      <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-xl sm:p-6">
        <h2 id="tx-edit-title" className="text-base font-semibold text-white md:text-lg">
          {t('transactions.edit.title')}
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          {transaction.stock?.symbol} · {t(`transactions.types.${transaction.type}`)}
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <label className="block">
            <span className="text-xs text-slate-400">{t('common.tradeDate')}</span>
            <input
              type="date"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              value={tradedAt}
              onChange={(e) => setTradedAt(e.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className="text-xs text-slate-400">{t('common.quantity')}</span>
            <input
              type="number"
              step="any"
              min="0"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className="text-xs text-slate-400">{t('common.unitPrice')}</span>
            <AmountInput
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              value={price}
              onValueChange={setPrice}
              formatOptions={{ maxFractionDigits: 2 }}
              required
            />
          </label>
          <label className="block">
            <span className="text-xs text-slate-400">{t('common.commissionOptional')}</span>
            <AmountInput
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              value={commission}
              onValueChange={setCommission}
              formatOptions={{ maxFractionDigits: 0 }}
            />
          </label>
          <label className="block">
            <span className="text-xs text-slate-400">{t('common.memoOptional')}</span>
            <input
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </label>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-700 py-2 text-sm text-slate-300 hover:bg-slate-800"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {loading ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
