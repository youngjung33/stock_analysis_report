'use client';

import { useState } from 'react';
import { CorporateActionType, Market, StockSearchResult } from '@sar/shared';
import { useServices } from '../hooks/useServices';
import { StockSearchField } from '../shared/StockSearchField';
import { Surface } from '../design-system';

interface Props {
  onSuccess?: () => void;
}

export function CorporateActionForm({ onSuccess }: Props) {
  const { createCorporateActionUseCase } = useServices();
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
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStock || !effectiveAt) {
      setError('종목과 적용일을 입력하세요.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await createCorporateActionUseCase.execute({
        stockSymbol: selectedStock.symbol,
        name: selectedStock.name,
        market: selectedStock.market,
        type,
        effectiveAt,
        cashAmount: cashAmount ? Number(cashAmount) : undefined,
        splitRatio: splitRatio ? Number(splitRatio) : undefined,
        targetSymbol: targetStock?.symbol,
        targetMarket: targetStock?.market,
        targetName: targetStock?.name,
        targetQuantity: targetQuantity ? Number(targetQuantity) : undefined,
        targetPrice: targetPrice ? Number(targetPrice) : undefined,
        memo: memo || undefined,
      });
      onSuccess?.();
      setCashAmount('');
      setMemo('');
    } catch {
      setError('기업행위 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Surface as="form" variant="section" onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-base font-semibold tracking-tight">기업행위 등록</h2>
        <p className="mt-2 text-sm text-muted-foreground">배당 · 분할 · 합병을 수동으로 등록합니다.</p>
      </div>

      <StockSearchField
        market={market}
        selected={selectedStock}
        onSelect={setSelectedStock}
        onClear={() => setSelectedStock(null)}
        onMarketChange={setMarket}
      />

      <div>
        <label className="text-xs text-slate-400">유형</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as CorporateActionType)}
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
        >
          <option value="DIVIDEND">배당</option>
          <option value="SPLIT">분할</option>
          <option value="MERGER">합병</option>
        </select>
      </div>

      <div>
        <label className="text-xs text-slate-400">적용일</label>
        <input
          type="date"
          value={effectiveAt}
          onChange={(e) => setEffectiveAt(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
        />
      </div>

      {type === 'DIVIDEND' && (
        <div>
          <label className="text-xs text-slate-400">배당 총액</label>
          <input
            type="number"
            value={cashAmount}
            onChange={(e) => setCashAmount(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
          />
        </div>
      )}

      {type === 'SPLIT' && (
        <div>
          <label className="text-xs text-slate-400">분할 비율 (2 = 1→2)</label>
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
            <label className="text-xs text-slate-400">받는 수량</label>
            <input
              type="number"
              value={targetQuantity}
              onChange={(e) => setTargetQuantity(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">전환 단가 (매입가)</label>
            <input
              type="number"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">현금 보상 (선택)</label>
            <input
              type="number"
              value={cashAmount}
              onChange={(e) => setCashAmount(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
            />
          </div>
        </>
      )}

      <div>
        <label className="text-xs text-slate-400">메모</label>
        <input
          type="text"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
        />
      </div>

      {error && <p className="text-sm text-rose-400">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
      >
        {submitting ? '등록 중...' : '기업행위 등록'}
      </button>
    </Surface>
  );
}
