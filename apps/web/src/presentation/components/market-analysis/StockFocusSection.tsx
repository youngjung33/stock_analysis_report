'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnalysisInsight, AnalysisTone, Market, StockSearchResult } from '@sar/shared';
import {
  translateAnalysisInsight,
  translateRecommendationEvidence,
  translateTag,
} from '@/i18n/translate-shared';
import { useStockAnalysis } from '../../hooks/useStockAnalysis';
import { useErrorToast } from '../../hooks/useErrorToast';
import { formatPercent, pnlClass } from '../../shared/formatters';
import { stockDetailHref } from '../../shared/stock-routes';
import { StockSearchField } from '../../shared/StockSearchField';

const TONE_STYLE: Record<AnalysisTone, string> = {
  bullish: 'border-emerald-500/30 bg-emerald-500/5',
  bearish: 'border-rose-500/30 bg-rose-500/5',
  neutral: 'border-slate-700 bg-slate-950/40',
};

const INSIGHT_ORDER = ['stockPast', 'stockPresent', 'stockOutlook'] as const;

function StockFocusInsightCard({ item }: { item: AnalysisInsight }) {
  const { t } = useTranslation();
  const localized = translateAnalysisInsight(item, t);

  return (
    <article className={`rounded-xl border p-4 ${TONE_STYLE[item.tone]}`}>
      <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
        {localized.categoryLabel}
      </span>
      <h4 className="mt-1 text-base font-semibold text-white">{localized.title}</h4>
      <p className="mt-2 text-xs leading-relaxed text-slate-300">{localized.summary}</p>
      <div className="mt-3 space-y-3 border-t border-slate-800/80 pt-3">
        <p className="text-xs leading-relaxed text-slate-300">{localized.reasoning}</p>
        <ul className="list-inside list-disc space-y-1 text-xs text-slate-400">
          {localized.evidence.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
    </article>
  );
}

export function StockFocusSection() {
  const { t, i18n } = useTranslation();
  const [market, setMarket] = useState<Market>(Market.KR);
  const [selected, setSelected] = useState<StockSearchResult | null>(null);
  const { data, isLoading, isError } = useStockAnalysis(selected);

  useErrorToast(isError, t('errors.stockAnalysisLoadFailed'));

  const orderedInsights = data
    ? INSIGHT_ORDER.map((cat) => data.insights.find((i) => i.category === cat)).filter(
        (i): i is AnalysisInsight => i != null,
      )
    : [];

  return (
    <div className="space-y-4 rounded-xl border border-violet-500/30 bg-violet-950/15 p-4">
      <div>
        <h3 className="text-sm font-semibold text-violet-100">{t('market.stockFocusTitle')}</h3>
        <p className="mt-1 text-xs text-violet-200/70">{t('market.stockFocusDesc')}</p>
      </div>

      <StockSearchField
        market={market}
        selected={selected}
        onSelect={setSelected}
        onClear={() => setSelected(null)}
        onMarketChange={setMarket}
        compact
      />

      {selected && isLoading && (
        <p className="text-sm text-slate-400">{t('market.stockFocusLoading')}</p>
      )}

      {data && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-800 bg-slate-950/50 px-4 py-3">
            <div>
              <p className="font-semibold text-white">
                {data.name}{' '}
                <span className="text-sm font-normal text-slate-400">({data.symbol})</span>
              </p>
              <p className="text-xs text-slate-500">
                {new Date(data.fetchedAt).toLocaleString(i18n.language)}
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-lg font-semibold text-white">
                {data.currentPrice.toLocaleString()} {data.currency}
              </p>
              <p className={`text-sm font-medium ${pnlClass(data.changePercent1d)}`}>
                {t('market.stockFocusToday', { percent: formatPercent(data.changePercent1d) })}
                {data.changePercent1w != null && (
                  <span className="ml-2 text-xs font-normal text-slate-500">
                    {t('market.stockFocus1w', { percent: formatPercent(data.changePercent1w) })}
                  </span>
                )}
              </p>
            </div>
            <span className="rounded-full border border-indigo-500/40 bg-indigo-950/40 px-2 py-0.5 text-[10px] font-medium text-indigo-200">
              {translateTag(data.tag, t)}
            </span>
            <Link
              href={stockDetailHref(data.symbol, data.market)}
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              {t('market.stockFocusChartLink')} →
            </Link>
          </div>

          <div className="space-y-3">
            {orderedInsights.map((item) => (
              <StockFocusInsightCard key={item.id} item={item} />
            ))}
          </div>

          {data.scoreBreakdown.length > 0 && (
            <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
              <p className="text-xs font-medium text-slate-400">{t('market.stockFocusScoreTitle')}</p>
              <ul className="mt-2 space-y-1 text-xs text-slate-300">
                {data.scoreBreakdown.slice(0, 5).map((item) => (
                  <li key={item.factor}>
                    {translateRecommendationEvidence(
                      { key: item.evidenceKey, params: item.evidenceParams },
                      t,
                    )}{' '}
                    ({item.delta >= 0 ? '+' : ''}
                    {item.delta.toFixed(2)})
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-[11px] leading-relaxed text-slate-600">{t('market.stockFocusDisclaimer')}</p>
        </div>
      )}
    </div>
  );
}
