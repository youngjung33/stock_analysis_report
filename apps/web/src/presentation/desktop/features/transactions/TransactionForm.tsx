import { Market, TransactionType } from '@sar/shared';
import { useTransactionForm } from '../../../hooks/screens/useTransactionForm';

interface Props {
  onSuccess: () => void;
}

export function DesktopTransactionForm({ onSuccess }: Props) {
  const form = useTransactionForm(onSuccess);

  return (
    <form
      onSubmit={form.handleSubmit}
      className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-6"
    >
      <h2 className="text-lg font-semibold text-white">?? ??</h2>
      {form.error && <p className="text-sm text-rose-400">{form.error}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm text-slate-400">?? ??</span>
          <input
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            value={form.stockSymbol}
            onChange={(e) => form.setStockSymbol(e.target.value)}
            placeholder="005930 ?? AAPL"
            required
          />
        </label>
        <label className="block">
          <span className="text-sm text-slate-400">??? (??)</span>
          <input
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            value={form.name}
            onChange={(e) => form.setName(e.target.value)}
            placeholder="????"
          />
        </label>
        <label className="block">
          <span className="text-sm text-slate-400">??</span>
          <select
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            value={form.market}
            onChange={(e) => form.setMarket(e.target.value as Market)}
          >
            <option value={Market.KR}>?? (KR)</option>
            <option value={Market.US}>?? (US)</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm text-slate-400">??</span>
          <select
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            value={form.type}
            onChange={(e) => form.setType(e.target.value as TransactionType)}
          >
            <option value={TransactionType.BUY}>??</option>
            <option value={TransactionType.SELL}>??</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm text-slate-400">??</span>
          <input
            type="number"
            step="any"
            min="0"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            value={form.quantity}
            onChange={(e) => form.setQuantity(e.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="text-sm text-slate-400">??</span>
          <input
            type="number"
            step="any"
            min="0"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            value={form.price}
            onChange={(e) => form.setPrice(e.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="text-sm text-slate-400">???</span>
          <input
            type="date"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            value={form.tradedAt}
            onChange={(e) => form.setTradedAt(e.target.value)}
            required
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm text-slate-400">?? (??)</span>
          <input
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            value={form.memo}
            onChange={(e) => form.setMemo(e.target.value)}
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={form.loading}
        className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
      >
        {form.loading ? '?? ?...' : '??'}
      </button>
    </form>
  );
}
