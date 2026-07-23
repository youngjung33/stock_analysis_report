import { useTranslation } from 'react-i18next';
import { translateLedgerMemo } from '@/i18n/translate-memo';
import { useTransactionList } from '../../hooks/screens/useTransactionList';
import { formatNumber } from '../../shared/formatters';

interface Props {
  refreshKey: number;
}

function EmptyTransactions() {
  const { t } = useTranslation();

  return (
    <>
      <div className="hidden rounded-xl border border-dashed border-slate-700 p-6 text-center text-slate-400 md:block">
        {t('transactions.list.empty')}
      </div>
      <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-400 md:hidden">
        {t('transactions.list.empty')}
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
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'ko' ? 'ko-KR' : 'en-US';

  return (
    <div className="hidden overflow-x-auto rounded-xl border border-slate-800 md:block">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-900 text-slate-400">
          <tr>
            <th className="px-4 py-3">{t('common.tradeDate')}</th>
            <th className="px-4 py-3">{t('common.symbol')}</th>
            <th className="px-4 py-3">{t('common.type')}</th>
            <th className="px-4 py-3">{t('common.quantity')}</th>
            <th className="px-4 py-3">{t('common.unitPrice')}</th>
            <th className="px-4 py-3">{t('common.memo')}</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {data.map((tx) => (
            <tr key={tx.id} className="border-t border-slate-800">
              <td className="px-4 py-3 text-slate-300">
                {new Date(tx.tradedAt).toLocaleDateString(dateLocale)}
              </td>
              <td className="px-4 py-3">
                <div className="text-white">{tx.stock?.symbol}</div>
                <div className="text-xs text-slate-500">{tx.stock?.name}</div>
              </td>
              <td
                className={`px-4 py-3 ${tx.type === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}
              >
                {t(`transactions.types.${tx.type}`)}
              </td>
              <td className="px-4 py-3 text-slate-300">{tx.quantity}</td>
              <td className="px-4 py-3 text-slate-300">
                {formatNumber(tx.price, tx.stock?.currency)}
              </td>
              <td className="px-4 py-3 text-slate-500">{translateLedgerMemo(tx.memo, t)}</td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => handleDelete(tx.id)}
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

function TransactionCardList({
  data,
  handleDelete,
}: {
  data: NonNullable<ReturnType<typeof useTransactionList>['data']>;
  handleDelete: (id: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'ko' ? 'ko-KR' : 'en-US';

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
              {t(`transactions.types.${tx.type}`)}
            </span>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
            <div>
              <dt className="text-slate-500">{t('common.tradeDate')}</dt>
              <dd className="text-slate-200">
                {new Date(tx.tradedAt).toLocaleDateString(dateLocale)}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">{t('common.quantity')}</dt>
              <dd className="text-slate-200">{tx.quantity}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{t('common.unitPrice')}</dt>
              <dd className="text-slate-200">{formatNumber(tx.price, tx.stock?.currency)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{t('common.memo')}</dt>
              <dd className="text-slate-400">{translateLedgerMemo(tx.memo, t)}</dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={() => handleDelete(tx.id)}
            className="mt-3 text-sm text-rose-400 hover:text-rose-300"
          >
            {t('common.delete')}
          </button>
        </li>
      ))}
    </ul>
  );
}

/** responsive 거래 내역 — mobile 카드 / desktop 테이블 */
export function TransactionList({ refreshKey }: Props) {
  const { t } = useTranslation();
  const { data, isLoading, handleDelete } = useTransactionList(refreshKey);

  if (isLoading) {
    return <p className="text-sm text-slate-400 md:text-base">{t('transactions.list.loading')}</p>;
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
