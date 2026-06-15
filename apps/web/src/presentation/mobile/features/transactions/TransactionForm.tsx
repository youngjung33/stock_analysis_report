import { Market, TransactionType } from '@sar/shared';
import { useTransactionForm } from '../../../hooks/screens/useTransactionForm';

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
      <h2 className="text-base font-semibold text-white">?? ??</h2>
      {form.error && <p className="text-sm text-rose-400">{form.error}</p>}

      <label className="block">
        <span className="text-xs text-slate-400">?? ??</span>
        <input
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white"
          value={form.stockSymbol}
          onChange={(e) => form.setStockSymbol(e.target.value)}
          placeholder="005930 ?? AAPL"
          required
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs text-slate-400">??</span>
          <select
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white"
            value={form.market}
            onChange={(e) => form.setMarket(e.target.value as Market)}
          >
            <option value={Market.KR}>KR</option>
            <option value={Market.US}>US</option>
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-slate-400">??</span>
          <select
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white"
            value={form.type}
            onChange={(e) => form.setType(e.target.value as TransactionType)}
          >
            <option value={TransactionType.BUY}>??</option>
            <option value={TransactionType.SELL}>??</option>
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs text-slate-400">??</span>
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
          <span className="text-xs text-slate-400">??</span>
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
        <span className="text-xs text-slate-400">???</span>
        <input
          type="date"
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white"
          value={form.tradedAt}
          onChange={(e) => form.setTradedAt(e.target.value)}
          required
        />
      </label>

      <button
        type="submit"
        disabled={form.loading}
        className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
      >
        {form.loading ? '?? ?...' : '??'}
      </button>
    </form>
  );
}
