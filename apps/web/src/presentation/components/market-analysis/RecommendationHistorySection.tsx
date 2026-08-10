'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  RECOMMENDATION_OUTCOME_HORIZONS,
  type RecommendationBatchView,
  type RecommendationOutcomeHorizon,
} from '@sar/shared';
import { translateTag } from '@/i18n/translate-shared';
import { useRecommendationHistory } from '../../hooks/useRecommendationHistory';
import { useErrorToast } from '../../hooks/useErrorToast';
import { formatPercent, pnlClass } from '../../shared/formatters';
import { stockDetailHref } from '../../shared/stock-routes';

function outcomeForHorizon(
  item: RecommendationBatchView['items'][number],
  horizon: RecommendationOutcomeHorizon,
) {
  return item.outcomes.find((o) => o.horizon === horizon);
}

function OutcomeCell({
  value,
  alpha,
}: {
  value: number | null | undefined;
  alpha?: number | null;
}) {
  if (value == null) {
    return <span className="text-slate-600">—</span>;
  }
  return (
    <span className="block">
      <span className={pnlClass(value)}>{formatPercent(value)}</span>
      {alpha != null && (
        <span className={`mt-0.5 block text-[10px] ${pnlClass(alpha)}`}>
          α {formatPercent(alpha)}
        </span>
      )}
    </span>
  );
}

function BatchCard({ batch }: { batch: RecommendationBatchView }) {
  const { t, i18n } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const topItems = batch.items.slice(0, expanded ? batch.items.length : 5);

  return (
    <article className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-white">
            {t('market.recommendationHistory.batchTitle', { date: batch.tradingDate })}
          </h4>
          <p className="mt-0.5 text-[11px] text-slate-500">
            {t('market.recommendationHistory.runMeta', {
              runAt: new Date(batch.runAt).toLocaleString(i18n.language),
              version: batch.engineVersion,
            })}
          </p>
        </div>
        <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] text-slate-400">
          {t('market.recommendationHistory.itemCount', { count: batch.items.length })}
        </span>
      </div>

      {batch.items.length === 0 ? (
        <p className="mt-3 text-xs text-slate-500">{t('market.recommendationHistory.emptyItems')}</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500">
                <th className="pb-2 pr-2 font-medium">#</th>
                <th className="pb-2 pr-2 font-medium">{t('market.recommendationHistory.colSymbol')}</th>
                <th className="pb-2 pr-2 font-medium">{t('market.recommendationHistory.colTag')}</th>
                <th className="pb-2 pr-2 font-medium">{t('market.recommendationHistory.colScore')}</th>
                {RECOMMENDATION_OUTCOME_HORIZONS.map((h) => (
                  <th key={h} className="pb-2 pr-2 font-medium">
                    {t(`market.recommendationHistory.horizon.${h}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topItems.map((item) => (
                <tr key={item.id} className="border-b border-slate-900/80 text-slate-300">
                  <td className="py-2 pr-2 text-slate-500">{item.rank}</td>
                  <td className="py-2 pr-2">
                    <Link
                      href={stockDetailHref(item.symbol, item.market)}
                      className="font-medium text-indigo-300 hover:text-indigo-200"
                    >
                      {item.symbol}
                    </Link>
                    <span className="ml-1 text-slate-600">{item.market}</span>
                  </td>
                  <td className="py-2 pr-2">{translateTag(item.tag as import('@sar/shared').RecommendationTag, t)}</td>
                  <td className="py-2 pr-2 text-slate-400">{item.score.toFixed(2)}</td>
                  {RECOMMENDATION_OUTCOME_HORIZONS.map((h) => {
                    const o = outcomeForHorizon(item, h);
                    return (
                      <td key={h} className="py-2 pr-2">
                        <OutcomeCell value={o?.returnPercent} alpha={o?.alphaVsBenchmark} />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {batch.items.length > 5 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-xs text-indigo-400 hover:text-indigo-300"
        >
          {expanded
            ? t('market.recommendationHistory.showLess')
            : t('market.recommendationHistory.showMore', { count: batch.items.length - 5 })}
        </button>
      )}
    </article>
  );
}

export function RecommendationHistorySection() {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useRecommendationHistory();

  useErrorToast(isError, t('errors.recommendationHistoryLoadFailed'));

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">{t('market.recommendationHistory.title')}</h2>
        <p className="mt-1 text-xs text-slate-500">{t('market.recommendationHistory.desc')}</p>
      </div>

      {isLoading && (
        <p className="text-sm text-slate-400">{t('market.recommendationHistory.loading')}</p>
      )}

      {!isLoading && !isError && data?.batches.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-800 p-4 text-sm text-slate-500">
          {t('market.recommendationHistory.empty')}
        </p>
      )}

      {data?.batches.map((batch) => (
        <BatchCard key={batch.id} batch={batch} />
      ))}

      <p className="text-[11px] leading-relaxed text-slate-600">
        {t('market.recommendationHistory.disclaimer')}
      </p>
    </section>
  );
}
