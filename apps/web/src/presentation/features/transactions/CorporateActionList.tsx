import { CorporateActionType } from '@sar/shared';
import { useTranslation } from 'react-i18next';
import { translateLedgerMemo } from '@/i18n/translate-memo';
import type { TFunction } from 'i18next';
import { CorporateAction } from '@/client/domain/models';
import { useCorporateActionList } from '../../hooks/screens/useCorporateActionList';
import { formatNumber } from '../../shared/formatters';

interface Props {
  refreshKey: number;
}

function corporateActionTypeLabel(type: CorporateActionType, t: TFunction): string {
  return t(`corporateAction.types.${type}`);
}

function formatActionDetail(action: CorporateAction, t: TFunction): string {
  const currency = action.stock?.currency;
  switch (action.type) {
    case 'DIVIDEND':
      return action.cashAmount != null ? formatNumber(action.cashAmount, currency) : '-';
    case 'SPLIT':
      return action.splitRatio != null
        ? t('corporateAction.detail.split', { ratio: action.splitRatio })
        : '-';
    case 'MERGER': {
      const parts: string[] = [];
      if (action.targetStock) {
        parts.push(t('corporateAction.detail.mergerTarget', { symbol: action.targetStock.symbol }));
      }
      if (action.targetQuantity != null) {
        parts.push(t('corporateAction.detail.mergerQuantity', { quantity: action.targetQuantity }));
      }
      if (action.targetPrice != null) {
        parts.push(formatNumber(action.targetPrice, action.targetStock?.currency));
      }
      if (action.cashAmount != null) {
        parts.push(
          t('corporateAction.detail.mergerCash', {
            amount: formatNumber(action.cashAmount, currency),
          }),
        );
      }
      return parts.length ? parts.join(' · ') : '-';
    }
  }
}

function EmptyCorporateActions() {
  const { t } = useTranslation();

  return (
    <>
      <div className="hidden rounded-xl border border-dashed border-slate-700 p-6 text-center text-slate-400 md:block">
        {t('corporateAction.list.empty')}
      </div>
      <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-400 md:hidden">
        {t('corporateAction.list.empty')}
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
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'ko' ? 'ko-KR' : 'en-US';

  return (
    <div className="hidden overflow-x-auto rounded-xl border border-slate-800 md:block">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-900 text-slate-400">
          <tr>
            <th className="px-4 py-3">{t('common.effectiveDate')}</th>
            <th className="px-4 py-3">{t('common.symbol')}</th>
            <th className="px-4 py-3">{t('common.type')}</th>
            <th className="px-4 py-3">{t('common.content')}</th>
            <th className="px-4 py-3">{t('common.memo')}</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {data.map((action) => (
            <tr key={action.id} className="border-t border-slate-800">
              <td className="px-4 py-3 text-slate-300">
                {new Date(action.effectiveAt).toLocaleDateString(dateLocale)}
              </td>
              <td className="px-4 py-3">
                <div className="text-white">{action.stock?.symbol}</div>
                <div className="text-xs text-slate-500">{action.stock?.name}</div>
              </td>
              <td className="px-4 py-3 text-indigo-300">
                {corporateActionTypeLabel(action.type, t)}
              </td>
              <td className="px-4 py-3 text-slate-300">{formatActionDetail(action, t)}</td>
              <td className="px-4 py-3 text-slate-500">{translateLedgerMemo(action.memo, t)}</td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => handleDelete(action.id)}
                  className="text-sm text-rose-400 hover:text-rose-300"
                >
                  {t('common.delete')}
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
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'ko' ? 'ko-KR' : 'en-US';

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
              {corporateActionTypeLabel(action.type, t)}
            </span>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
            <div>
              <dt className="text-slate-500">{t('common.effectiveDate')}</dt>
              <dd className="text-slate-200">
                {new Date(action.effectiveAt).toLocaleDateString(dateLocale)}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-slate-500">{t('common.content')}</dt>
              <dd className="text-slate-200">{formatActionDetail(action, t)}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-slate-500">{t('common.memo')}</dt>
              <dd className="text-slate-400">{translateLedgerMemo(action.memo, t)}</dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={() => handleDelete(action.id)}
            className="mt-3 text-sm text-rose-400 hover:text-rose-300"
          >
            {t('common.delete')}
          </button>
        </li>
      ))}
    </ul>
  );
}

/** responsive 배당·분할·합병 내역 — mobile 카드 / desktop 테이블 */
export function CorporateActionList({ refreshKey }: Props) {
  const { t } = useTranslation();
  const { data, isLoading, handleDelete } = useCorporateActionList(refreshKey);

  if (isLoading) {
    return <p className="text-sm text-slate-400 md:text-base">{t('corporateAction.list.loading')}</p>;
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
