import { CorporateActionType } from '@sar/shared';
import { CorporateAction } from '@/client/domain/models';
import { useCorporateActionList } from '../../hooks/screens/useCorporateActionList';
import { formatNumber } from '../../shared/formatters';

interface Props {
  refreshKey: number;
}

function corporateActionTypeLabel(type: CorporateActionType): string {
  switch (type) {
    case 'DIVIDEND':
      return '배당';
    case 'SPLIT':
      return '주식분할';
    case 'MERGER':
      return '합병';
  }
}

function formatActionDetail(action: CorporateAction): string {
  const currency = action.stock?.currency;
  switch (action.type) {
    case 'DIVIDEND':
      return action.cashAmount != null ? formatNumber(action.cashAmount, currency) : '-';
    case 'SPLIT':
      return action.splitRatio != null ? `1→${action.splitRatio}` : '-';
    case 'MERGER': {
      const parts: string[] = [];
      if (action.targetStock) {
        parts.push(`→ ${action.targetStock.symbol}`);
      }
      if (action.targetQuantity != null) {
        parts.push(`${action.targetQuantity}주`);
      }
      if (action.targetPrice != null) {
        parts.push(formatNumber(action.targetPrice, action.targetStock?.currency));
      }
      if (action.cashAmount != null) {
        parts.push(`현금 ${formatNumber(action.cashAmount, currency)}`);
      }
      return parts.length ? parts.join(' · ') : '-';
    }
  }
}

function EmptyCorporateActions() {
  return (
    <>
      <div className="hidden rounded-xl border border-dashed border-slate-700 p-6 text-center text-slate-400 md:block">
        등록된 배당·분할·합병 내역이 없습니다.
      </div>
      <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-400 md:hidden">
        등록된 배당·분할·합병 내역이 없습니다.
      </div>
    </>
  );
}

function CorporateActionTable({
  data,
  handleDelete,
}: {
  data: NonNullable<ReturnType<typeof useCorporateActionList>['data']>;
  handleDelete: (id: string) => void;
}) {
  return (
    <div className="hidden overflow-x-auto rounded-xl border border-slate-800 md:block">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-900 text-slate-400">
          <tr>
            <th className="px-4 py-3">적용일</th>
            <th className="px-4 py-3">종목</th>
            <th className="px-4 py-3">유형</th>
            <th className="px-4 py-3">내용</th>
            <th className="px-4 py-3">메모</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {data.map((action) => (
            <tr key={action.id} className="border-t border-slate-800">
              <td className="px-4 py-3 text-slate-300">
                {new Date(action.effectiveAt).toLocaleDateString('ko-KR')}
              </td>
              <td className="px-4 py-3">
                <div className="text-white">{action.stock?.symbol}</div>
                <div className="text-xs text-slate-500">{action.stock?.name}</div>
              </td>
              <td className="px-4 py-3 text-indigo-300">{corporateActionTypeLabel(action.type)}</td>
              <td className="px-4 py-3 text-slate-300">{formatActionDetail(action)}</td>
              <td className="px-4 py-3 text-slate-500">{action.memo ?? '-'}</td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => handleDelete(action.id)}
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

function CorporateActionCardList({
  data,
  handleDelete,
}: {
  data: NonNullable<ReturnType<typeof useCorporateActionList>['data']>;
  handleDelete: (id: string) => void;
}) {
  return (
    <ul className="space-y-3 md:hidden">
      {data.map((action) => (
        <li key={action.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-white">{action.stock?.symbol}</p>
              <p className="text-xs text-slate-500">{action.stock?.name}</p>
            </div>
            <span className="text-xs font-medium text-indigo-300">
              {corporateActionTypeLabel(action.type)}
            </span>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
            <div>
              <dt className="text-slate-500">적용일</dt>
              <dd className="text-slate-200">
                {new Date(action.effectiveAt).toLocaleDateString('ko-KR')}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-slate-500">내용</dt>
              <dd className="text-slate-200">{formatActionDetail(action)}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-slate-500">메모</dt>
              <dd className="text-slate-400">{action.memo ?? '-'}</dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={() => handleDelete(action.id)}
            className="mt-3 text-sm text-rose-400 hover:text-rose-300"
          >
            삭제
          </button>
        </li>
      ))}
    </ul>
  );
}

/** responsive 배당·분할·합병 내역 — mobile 카드 / desktop 테이블 */
export function CorporateActionList({ refreshKey }: Props) {
  const { data, isLoading, handleDelete } = useCorporateActionList(refreshKey);

  if (isLoading) {
    return <p className="text-sm text-slate-400 md:text-base">배당·분할·합병 내역 불러오는 중...</p>;
  }

  if (!data?.length) {
    return <EmptyCorporateActions />;
  }

  return (
    <>
      <CorporateActionCardList data={data} handleDelete={handleDelete} />
      <CorporateActionTable data={data} handleDelete={handleDelete} />
    </>
  );
}
