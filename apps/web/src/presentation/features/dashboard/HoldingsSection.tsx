'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { DashboardHolding } from '@/client/domain/models';
import { translateMarketLabel } from '@/i18n/translate-shared';
import { Surface } from '../../design-system';
import { stockDetailHref } from '../../shared/stock-routes';
import { formatNumber, formatPercent, pnlClass } from '../../shared/formatters';

interface Props {
  holdings: DashboardHolding[];
  preferKrw?: boolean;
}

function resolveKrwDisplay(holdings: DashboardHolding[], preferKrw?: boolean) {
  const hasMixed = holdings.some((h) => h.currency === 'USD');
  return preferKrw || hasMixed;
}

function EmptyHoldings() {
  const { t } = useTranslation();

  return (
    <>
      <Surface
        variant="subtle"
        className="hidden border-dashed py-12 text-center text-muted-foreground md:block"
      >
        {t('portfolio.holdings.empty')}
      </Surface>
      <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-400 md:hidden">
        {t('portfolio.holdings.empty')}
      </div>
    </>
  );
}

function HoldingsTable({ holdings, useKrw }: { holdings: DashboardHolding[]; useKrw: boolean }) {
  const { t } = useTranslation();

  return (
    <Surface as="div" className="hidden overflow-hidden p-0 md:block">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-muted/50 text-muted-foreground">
          <tr>
            <th className="px-5 py-4">{t('common.symbol')}</th>
            <th className="px-5 py-4">{t('common.marketColumn')}</th>
            <th className="px-5 py-4">{t('common.quantity')}</th>
            <th className="px-5 py-4">{t('common.averageCost')}</th>
            <th className="px-5 py-4">{t('common.currentPrice')}</th>
            <th className="px-5 py-4">{t('common.changePercent')}</th>
            <th className="px-5 py-4">
              {useKrw ? t('common.marketValueKrw') : t('common.marketValue')}
            </th>
            <th className="px-5 py-4">
              {useKrw ? t('common.unrealizedPnlKrw') : t('common.unrealizedPnl')}
            </th>
            <th className="px-5 py-4">
              {useKrw ? t('common.realizedPnlKrw') : t('common.realizedPnl')}
            </th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((h) => (
            <tr key={h.stockId} className="border-t border-border bg-card/30">
              <td className="px-5 py-4">
                <Link href={stockDetailHref(h.symbol, h.market)} className="group block">
                  <div className="font-medium text-foreground group-hover:text-primary">{h.symbol}</div>
                  <div className="text-xs text-muted-foreground">{h.name}</div>
                </Link>
              </td>
              <td className="px-5 py-4 text-muted-foreground">
                {translateMarketLabel(h.market, t)}
              </td>
              <td className="px-5 py-4 text-muted-foreground">{h.quantity}</td>
              <td className="px-5 py-4 text-muted-foreground">
                {formatNumber(h.averageCost, h.currency)}
              </td>
              <td className="px-5 py-4 text-muted-foreground">
                {formatNumber(h.currentPrice, h.currency)}
              </td>
              <td className={`px-5 py-4 ${pnlClass(h.changePercent)}`}>
                {formatPercent(h.changePercent)}
              </td>
              <td className="px-5 py-4 text-muted-foreground">
                {formatNumber(useKrw ? h.marketValueKrw : h.marketValue, useKrw ? 'KRW' : h.currency)}
              </td>
              <td className={`px-5 py-4 ${pnlClass(useKrw ? h.unrealizedPnlKrw : h.unrealizedPnl)}`}>
                {formatNumber(useKrw ? h.unrealizedPnlKrw : h.unrealizedPnl, useKrw ? 'KRW' : h.currency)}
              </td>
              <td className={`px-5 py-4 ${pnlClass(useKrw ? h.realizedPnlKrw : h.realizedPnl)}`}>
                {formatNumber(useKrw ? h.realizedPnlKrw : h.realizedPnl, useKrw ? 'KRW' : h.currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Surface>
  );
}

function HoldingsCardList({ holdings, useKrw }: { holdings: DashboardHolding[]; useKrw: boolean }) {
  const { t } = useTranslation();

  return (
    <ul className="space-y-3 md:hidden">
      {holdings.map((h) => (
        <li key={h.stockId} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-start justify-between gap-2">
            <Link href={stockDetailHref(h.symbol, h.market)} className="group min-w-0 flex-1">
              <p className="font-semibold text-white group-hover:text-indigo-300">{h.symbol}</p>
              <p className="text-xs text-slate-500 group-hover:text-slate-400">{h.name}</p>
            </Link>
            <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
              {translateMarketLabel(h.market, t)}
            </span>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
            <div>
              <dt className="text-slate-500">{t('common.quantity')}</dt>
              <dd className="text-slate-200">{h.quantity}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{t('common.averageCost')}</dt>
              <dd className="text-slate-200">{formatNumber(h.averageCost, h.currency)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{t('common.currentPrice')}</dt>
              <dd className="text-slate-200">{formatNumber(h.currentPrice, h.currency)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{t('common.changePercent')}</dt>
              <dd className={pnlClass(h.changePercent)}>{formatPercent(h.changePercent)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">
                {useKrw ? t('common.marketValueKrw') : t('common.marketValue')}
              </dt>
              <dd className="text-slate-200">
                {formatNumber(useKrw ? h.marketValueKrw : h.marketValue, useKrw ? 'KRW' : h.currency)}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">
                {useKrw ? t('common.unrealizedPnlKrw') : t('common.unrealizedPnl')}
              </dt>
              <dd className={pnlClass(useKrw ? h.unrealizedPnlKrw : h.unrealizedPnl)}>
                {formatNumber(useKrw ? h.unrealizedPnlKrw : h.unrealizedPnl, useKrw ? 'KRW' : h.currency)}
              </dd>
            </div>
          </dl>
        </li>
      ))}
    </ul>
  );
}

/** responsive 보유 종목 — mobile 카드 / desktop 테이블 */
export function HoldingsSection({ holdings, preferKrw }: Props) {
  if (holdings.length === 0) {
    return <EmptyHoldings />;
  }

  const useKrw = resolveKrwDisplay(holdings, preferKrw);

  return (
    <>
      <HoldingsCardList holdings={holdings} useKrw={useKrw} />
      <HoldingsTable holdings={holdings} useKrw={useKrw} />
    </>
  );
}
