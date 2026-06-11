import { FormEvent, useState } from 'react';
import { Market, TransactionType } from '@sar/shared';
import { useServices } from '../hooks/useServices';
import axios from 'axios';

interface Props {
  onSuccess: () => void;
}

export function TransactionForm({ onSuccess }: Props) {
  const { createTransactionUseCase } = useServices();
  const [stockSymbol, setStockSymbol] = useState('');
  const [market, setMarket] = useState<Market>(Market.KR);
  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.BUY);
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [tradedAt, setTradedAt] = useState(new Date().toISOString().slice(0, 10));
  const [memo, setMemo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await createTransactionUseCase.execute({
        stockSymbol,
        market,
        name: name || undefined,
        type,
        quantity: Number(quantity),
        price: Number(price),
        tradedAt: new Date(tradedAt).toISOString(),
        memo: memo || undefined,
      });
      setStockSymbol('');
      setName('');
      setQuantity('');
      setPrice('');
      setMemo('');
      onSuccess();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message;
        setError(Array.isArray(msg) ? msg.join(', ') : (msg ?? '등록 실패'));
      } else {
        setError('등록 실패');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-6">
      <h2 className="text-lg font-semibold text-white">거래 등록</h2>
      {error && <p className="text-sm text-rose-400">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm text-slate-400">종목 코드</span>
          <input
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            value={stockSymbol}
            onChange={(e) => setStockSymbol(e.target.value)}
            placeholder="005930 또는 AAPL"
            required
          />
        </label>
        <label className="block">
          <span className="text-sm text-slate-400">종목명 (선택)</span>
          <input
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="삼성전자"
          />
        </label>
        <label className="block">
          <span className="text-sm text-slate-400">시장</span>
          <select
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            value={market}
            onChange={(e) => setMarket(e.target.value as Market)}
          >
            <option value={Market.KR}>한국 (KR)</option>
            <option value={Market.US}>미국 (US)</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm text-slate-400">유형</span>
          <select
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            value={type}
            onChange={(e) => setType(e.target.value as TransactionType)}
          >
            <option value={TransactionType.BUY}>매수</option>
            <option value={TransactionType.SELL}>매도</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm text-slate-400">수량</span>
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
          <span className="text-sm text-slate-400">단가</span>
          <input
            type="number"
            step="any"
            min="0"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="text-sm text-slate-400">거래일</span>
          <input
            type="date"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            value={tradedAt}
            onChange={(e) => setTradedAt(e.target.value)}
            required
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm text-slate-400">메모 (선택)</span>
          <input
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
      >
        {loading ? '등록 중...' : '등록'}
      </button>
    </form>
  );
}
