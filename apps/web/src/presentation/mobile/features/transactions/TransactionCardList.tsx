import { useTransactionList } from '../../../hooks/screens/useTransactionList';
import { formatNumber } from '../../../shared/formatters';

interface Props {
  refreshKey: number;
}

export function MobileTransactionCardList({ refreshKey }: Props) {
  const { data, isLoading, handleDelete } = useTransactionList(refreshKey);

  if (isLoading) return <p className="text-sm text-slate-400">?? ?? ?? ?...</p>;

  if (!data?.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-400">
        ??? ??? ????.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {data.map((tx) => (
        <li
          key={tx.id}
          className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-white">{tx.stock?.symbol}</p>
              <p className="text-xs text-slate-500">{tx.stock?.name}</p>
            </div>
            <span
              className={`text-xs font-medium ${tx.type === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}
            >
              {tx.type === 'BUY' ? '??' : '??'}
            </span>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
            <div>
              <dt className="text-slate-500">??</dt>
              <dd className="text-slate-200">
                {new Date(tx.tradedAt).toLocaleDateString('ko-KR')}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">??</dt>
              <dd className="text-slate-200">{tx.quantity}</dd>
            </div>
            <div>
              <dt className="text-slate-500">??</dt>
              <dd className="text-slate-200">{formatNumber(tx.price, tx.stock?.currency)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">??</dt>
              <dd className="text-slate-400">{tx.memo ?? '-'}</dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={() => handleDelete(tx.id)}
            className="mt-3 text-sm text-rose-400 hover:text-rose-300"
          >
            ??
          </button>
        </li>
      ))}
    </ul>
  );
}
