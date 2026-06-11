import { useQuery } from '@tanstack/react-query';
import { useServices } from '../hooks/useServices';
import { formatNumber } from './formatters';

interface Props {
  refreshKey: number;
}

export function TransactionList({ refreshKey }: Props) {
  const { listTransactionsUseCase, deleteTransactionUseCase } = useServices();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['transactions', refreshKey],
    queryFn: () => listTransactionsUseCase.execute(),
  });

  async function handleDelete(id: string) {
    if (!confirm('이 거래를 삭제할까요?')) return;
    await deleteTransactionUseCase.execute(id);
    refetch();
  }

  if (isLoading) return <p className="text-slate-400">거래 내역 로딩 중...</p>;

  if (!data?.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-slate-400">
        등록된 거래가 없습니다.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-900 text-slate-400">
          <tr>
            <th className="px-4 py-3">일자</th>
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
              <td className={`px-4 py-3 ${tx.type === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {tx.type === 'BUY' ? '매수' : '매도'}
              </td>
              <td className="px-4 py-3 text-slate-300">{tx.quantity}</td>
              <td className="px-4 py-3 text-slate-300">
                {formatNumber(tx.price, tx.stock?.currency)}
              </td>
              <td className="px-4 py-3 text-slate-500">{tx.memo ?? '-'}</td>
              <td className="px-4 py-3">
                <button
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
