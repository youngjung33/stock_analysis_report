'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnalysisCategory, AnalysisInsight, AnalysisTone, Market, StockSearchResult } from '@sar/shared';
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

const INSIGHT_ORDER: AnalysisCategory[] = [
  'stockStory',
  'stockPast',
  'stockPresent',
  'stockMarket',
  'stockOutlook',
  'stockNewsNote',
  'stockAction',
];

function StockFocusInsightCard({
  item,
  prominent,
}: {
  item: AnalysisInsight;
  prominent?: boolean;
}) {
  const { t } = useTranslation();
  const localized = translateAnalysisInsight(item, t);
  const isNewsNote = item.category === 'stockNewsNote';
  const isAction = item.category === 'stockAction';

  return (
    <article
      className={`rounded-xl border p-4 ${TONE_STYLE[item.tone]} ${
        prominent ? 'border-violet-400/40 bg-violet-950/25' : ''
      } ${isNewsNote ? 'border-dashed border-slate-600 bg-slate-950/30 opacity-90' : ''} ${
        isAction ? 'border-amber-500/40 bg-amber-950/20 ring-1 ring-amber-500/20' : ''
      }`}
    >
      <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
        {localized.categoryLabel}
      </span>
      {isAction && (
        <p className="mt-1 text-[10px] font-medium text-amber-400/90">
          {t('market.stockFocusActionBadge')}
        </p>
      )}
      <h4 className={`mt-1 font-semibold text-white ${prominent || isAction ? 'text-lg' : 'text-base'}`}>
        {localized.title}
      </h4>
      <p className={`mt-2 leading-relaxed text-slate-300 ${prominent || isAction ? 'text-sm font-medium' : 'text-xs'}`}>
        {localized.summary}
      </p>
      <div className="mt-3 space-y-3 border-t border-slate-800/80 pt-3">
        <p className="text-xs leading-relaxed text-slate-300">{localized.reasoning}</p>
        <ul className="list-inside list-disc space-y-1.5 text-xs text-slate-400">
          {localized.evidence.map((line, index) => (
            <li key={`${item.id}-ev-${index}`}>{line}</li>
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
        <p className="mt-1 text-xs leading-relaxed text-violet-200/70">{t('market.stockFocusDesc')}</p>
        <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{t('market.stockFocusPriceFirst')}</p>
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
                {data.changePercent1mo != null && (
                  <span className="ml-2 text-xs font-normal text-slate-500">
                    {t('market.stockFocus1mo', { percent: formatPercent(data.changePercent1mo) })}
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
              <StockFocusInsightCard
                key={item.id}
                item={item}
                prominent={item.category === 'stockStory'}
              />
            ))}
          </div>

          {data.scoreBreakdown.length > 0 && (
            <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
              <p className="text-xs font-medium text-slate-400">{t('market.stockFocusScoreTitle')}</p>
              <p className="mt-1 text-[10px] text-slate-600">{t('market.stockFocusScoreDesc')}</p>
              <ul className="mt-2 space-y-1 text-xs text-slate-300">
                {data.scoreBreakdown.slice(0, 6).map((item, index) => (
                  <li key={`${item.factor}-${index}`}>
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
