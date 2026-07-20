import { useTransactionList } from '../../hooks/screens/useTransactionList';
import { formatNumber } from '../../shared/formatters';

interface Props {
  refreshKey: number;
}

function EmptyTransactions() {
  return (
    <>
      <div className="hidden rounded-xl border border-dashed border-slate-700 p-6 text-center text-slate-400 md:block">
        등록된 매매가 없습니다.
      </div>
      <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-400 md:hidden">
        등록된 매매가 없습니다.
      </div>
    </>
  );
}

function TransactionTable({
  data,
  handleDelete,
}: {
  data: NonNullable<ReturnType<typeof useTransactionList>['data']>;
  handleDelete: (id: string) => void;
}) {
  return (
    <div className="hidden overflow-x-auto rounded-xl border border-slate-800 md:block">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-900 text-slate-400">
          <tr>
            <th className="px-4 py-3">매매일</th>
            <th className="px-4 py-3">종목</th>
            <th className="px-4 py-3">유형</th>
            <th className="px-4 py-3">수량</th>
            <th className="px-4 py-3">단가</th>
            <th className="px-4 py-3">메모</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {data.map((tx) => (
            <tr key={tx.id} className="border-t border-slate-800">
              <td className="px-4 py-3 text-slate-300">
                {new Date(tx.tradedAt).toLocaleDateString('ko-KR')}
              </td>
              <td className="px-4 py-3">
                <div className="text-white">{tx.stock?.symbol}</div>
                <div className="text-xs text-slate-500">{tx.stock?.name}</div>
              </td>
              <td
                className={`px-4 py-3 ${tx.type === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}
              >
                {tx.type === 'BUY' ? '매수' : '매도'}
              </td>
              <td className="px-4 py-3 text-slate-300">{tx.quantity}</td>
              <td className="px-4 py-3 text-slate-300">
                {formatNumber(tx.price, tx.stock?.currency)}
              </td>
              <td className="px-4 py-3 text-slate-500">{tx.memo ?? '-'}</td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => handleDelete(tx.id)}
                  className="text-sm text-rose-400 hover:text-rose-300"
                >
                  삭제
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TransactionCardList({
  data,
  handleDelete,
}: {
  data: NonNullable<ReturnType<typeof useTransactionList>['data']>;
  handleDelete: (id: string) => void;
}) {
  return (
    <ul className="space-y-3 md:hidden">
      {data.map((tx) => (
        <li key={tx.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-white">{tx.stock?.symbol}</p>
              <p className="text-xs text-slate-500">{tx.stock?.name}</p>
            </div>
            <span
              className={`text-xs font-medium ${tx.type === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}
            >
              {tx.type === 'BUY' ? '매수' : '매도'}
            </span>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
            <div>
              <dt className="text-slate-500">매매일</dt>
              <dd className="text-slate-200">
                {new Date(tx.tradedAt).toLocaleDateString('ko-KR')}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">수량</dt>
              <dd className="text-slate-200">{tx.quantity}</dd>
            </div>
            <div>
              <dt className="text-slate-500">단가</dt>
              <dd className="text-slate-200">{formatNumber(tx.price, tx.stock?.currency)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">메모</dt>
              <dd className="text-slate-400">{tx.memo ?? '-'}</dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={() => handleDelete(tx.id)}
            className="mt-3 text-sm text-rose-400 hover:text-rose-300"
          >
            삭제
          </button>
        </li>
      ))}
    </ul>
  );
}

/** responsive 거래 내역 — mobile 카드 / desktop 테이블 */
export function TransactionList({ refreshKey }: Props) {
  const { data, isLoading, handleDelete } = useTransactionList(refreshKey);

  if (isLoading) {
    return <p className="text-sm text-slate-400 md:text-base">매매 내역 불러오는 중...</p>;
  }

  if (!data?.length) {
    return <EmptyTransactions />;
  }

  return (
    <>
      <TransactionCardList data={data} handleDelete={handleDelete} />
      <TransactionTable data={data} handleDelete={handleDelete} />
    </>
  );
}
