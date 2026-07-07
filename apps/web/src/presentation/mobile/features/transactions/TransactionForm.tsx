import { TransactionType } from '@sar/shared';
import { useTransactionForm } from '../../../hooks/screens/useTransactionForm';
import { StockSearchField } from '../../../shared/StockSearchField';

interface Props {
  onSuccess: () => void;
}

export function MobileTransactionForm({ onSuccess }: Props) {
  const form = useTransactionForm(onSuccess);

  return (
    <form
      onSubmit={form.handleSubmit}
      className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4"
    >
      <h2 className="text-base font-semibold text-white">거래 등록</h2>

      <StockSearchField
        market={form.market}
        selected={form.selectedStock}
        onSelect={form.setSelectedStock}
        onClear={() => form.setSelectedStock(null)}
        onMarketChange={form.handleMarketChange}
        compact
      />

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs text-slate-400">거래 유형</span>
          <select
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white"
            value={form.type}
            onChange={(e) => form.setType(e.target.value as TransactionType)}
          >
            <option value={TransactionType.BUY}>매수</option>
            <option value={TransactionType.SELL}>매도</option>
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-slate-400">거래일</span>
          <input
            type="date"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white"
            value={form.tradedAt}
            onChange={(e) => form.setTradedAt(e.target.value)}
            required
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs text-slate-400">수량</span>
          <input
            type="number"
            step="any"
            min="0"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white"
            value={form.quantity}
            onChange={(e) => form.setQuantity(e.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="text-xs text-slate-400">단가</span>
          <input
            type="number"
            step="any"
            min="0"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white"
            value={form.price}
            onChange={(e) => form.setPrice(e.target.value)}
            required
          />
        </label>
      </div>

      <label className="block">
        <span className="text-xs text-slate-400">메모 (선택)</span>
        <input
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white"
          value={form.memo}
          onChange={(e) => form.setMemo(e.target.value)}
        />
      </label>

      <button
        type="submit"
        disabled={form.loading || !form.selectedStock}
        className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
      >
        {form.loading ? '등록 중...' : '등록'}
      </button>
    </form>
  );
}
