'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CorporateActionType, Market, parseAmountInput, StockSearchResult } from '@sar/shared';
import { getErrorMessage } from '@/client/domain/errors/app-error';
import { useToast } from '../components/Toast';
import { useServices } from '../hooks/useServices';
import { StockSearchField } from '../shared/StockSearchField';
import { AmountInput } from '../shared/AmountInput';
import { Surface } from '../design-system';

interface Props {
  onSuccess?: () => void;
}

export function CorporateActionForm({ onSuccess }: Props) {
  const { t } = useTranslation();
  const { createCorporateActionUseCase } = useServices();
  const { showError, showSuccess } = useToast();
  const [type, setType] = useState<CorporateActionType>('DIVIDEND');
  const [market, setMarket] = useState<Market>(Market.KR);
  const [selectedStock, setSelectedStock] = useState<StockSearchResult | null>(null);
  const [targetMarket, setTargetMarket] = useState<Market>(Market.KR);
  const [targetStock, setTargetStock] = useState<StockSearchResult | null>(null);
  const [effectiveAt, setEffectiveAt] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [splitRatio, setSplitRatio] = useState('2');
  const [targetQuantity, setTargetQuantity] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [memo, setMemo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStock || !effectiveAt) {
      showError(t('corporateAction.form.missingFields'));
      return;
    }

    setSubmitting(true);
    try {
      await createCorporateActionUseCase.execute({
        stockSymbol: selectedStock.symbol,
        name: selectedStock.name,
        market: selectedStock.market,
        type,
        effectiveAt,
        cashAmount: cashAmount ? parseAmountInput(cashAmount) : undefined,
        splitRatio: splitRatio ? Number(splitRatio) : undefined,
        targetSymbol: targetStock?.symbol,
        targetMarket: targetStock?.market,
        targetName: targetStock?.name,
        targetQuantity: targetQuantity ? Number(targetQuantity) : undefined,
        targetPrice: targetPrice ? parseAmountInput(targetPrice) : undefined,
        memo: memo || undefined,
      });
      showSuccess(t('corporateAction.toast.registered'));
      onSuccess?.();
      setCashAmount('');
      setMemo('');
    } catch (err) {
      showError(getErrorMessage(err, t('corporateAction.toast.registerFailed')));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Surface as="form" variant="section" onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-base font-semibold tracking-tight">{t('corporateAction.form.title')}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('corporateAction.form.description')}
        </p>
      </div>

      <StockSearchField
        market={market}
        selected={selectedStock}
        onSelect={setSelectedStock}
        onClear={() => setSelectedStock(null)}
        onMarketChange={setMarket}
      />

      <div>
        <label className="text-xs text-slate-400">{t('common.type')}</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as CorporateActionType)}
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
        >
          <option value="DIVIDEND">{t('corporateAction.types.DIVIDEND')}</option>
          <option value="SPLIT">{t('corporateAction.types.SPLIT')}</option>
          <option value="MERGER">{t('corporateAction.types.MERGER')}</option>
        </select>
      </div>

      <div>
        <label className="text-xs text-slate-400">{t('common.effectiveDate')}</label>
        <input
          type="date"
          value={effectiveAt}
          onChange={(e) => setEffectiveAt(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
        />
      </div>

      {type === 'DIVIDEND' && (
        <div>
          <label className="text-xs text-slate-400">{t('corporateAction.form.dividendAmount')}</label>
          <AmountInput
            value={cashAmount}
            onValueChange={setCashAmount}
            formatOptions={{ maxFractionDigits: 0 }}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
          />
        </div>
      )}

      {type === 'SPLIT' && (
        <div>
          <label className="text-xs text-slate-400">{t('corporateAction.form.splitRatio')}</label>
          <input
            type="number"
            value={splitRatio}
            onChange={(e) => setSplitRatio(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
          />
        </div>
      )}

      {type === 'MERGER' && (
        <>
          <StockSearchField
            market={targetMarket}
            selected={targetStock}
            onSelect={setTargetStock}
            onClear={() => setTargetStock(null)}
            onMarketChange={setTargetMarket}
          />
          <div>
            <label className="text-xs text-slate-400">{t('corporateAction.form.targetQuantity')}</label>
            <input
              type="number"
              value={targetQuantity}
              onChange={(e) => setTargetQuantity(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">{t('corporateAction.form.targetPrice')}</label>
            <AmountInput
              value={targetPrice}
              onValueChange={setTargetPrice}
              formatOptions={{ maxFractionDigits: 2 }}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">{t('corporateAction.form.cashCompensation')}</label>
            <AmountInput
              value={cashAmount}
              onValueChange={setCashAmount}
              formatOptions={{ maxFractionDigits: 0 }}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
            />
          </div>
        </>
      )}

      <div>
        <label className="text-xs text-slate-400">{t('common.memo')}</label>
        <input
          type="text"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
      >
        {submitting ? t('common.registering') : t('common.register')}
      </button>
    </Surface>
  );
}
