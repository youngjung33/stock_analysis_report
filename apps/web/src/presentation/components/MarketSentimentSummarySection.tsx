'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { buildMarketInsights, sentimentBadgeClass } from '@sar/shared';
import { translateRegionSentiment, translateSentiment, translateTag } from '@/i18n/translate-shared';
import { useFeaturedQuotes } from '../hooks/useFeaturedQuotes';
import { formatPercent, pnlClass } from '../shared/formatters';
import { marketAnalysisHref } from '../shared/stock-routes';

interface Props {
  compact?: boolean;
}

export function MarketSentimentSummarySection({ compact }: Props) {
  const { t } = useTranslation();
  const { data, isLoading } = useFeaturedQuotes();

  const insights = useMemo(() => {
    if (!data) return null;
    return buildMarketInsights(data.kr, data.us);
  }, [data]);

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className={`font-semibold text-white ${compact ? 'text-base' : 'text-lg'}`}>
            {t('market.sentimentTitle')}
          </h2>
          <p className="mt-1 text-xs text-slate-500">{t('market.sentimentDesc')}</p>
        </div>
        <Link
          href={marketAnalysisHref()}
          className="shrink-0 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-500 sm:text-sm"
        >
          {t('market.detailAnalysisLink')}
        </Link>
      </div>

      {isLoading && <p className="mt-4 text-sm text-slate-400">{t('market.loadingQuotes')}</p>}

      {insights && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[insights.kr, insights.us].map((sentiment) => {
            const localized = translateRegionSentiment(sentiment, t);
            return (
            <div
              key={sentiment.market}
              className="rounded-lg border border-slate-800/80 bg-slate-900/40 p-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className={`font-medium text-slate-200 ${compact ? 'text-sm' : ''}`}>
                  {sentiment.market === 'KR' ? t('market.regionKr') : t('market.regionUs')}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${sentimentBadgeClass(sentiment.label)}`}
                >
                  {translateSentiment(sentiment.label, t)}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">{localized.description}</p>
              {sentiment.avgChangePercent !== null && (
                <p className={`mt-2 text-sm font-medium ${pnlClass(sentiment.avgChangePercent)}`}>
                  {t('market.avgChange', { percent: formatPercent(sentiment.avgChangePercent) })}
                  <span className="ml-2 text-xs font-normal text-slate-500">
                    {t('market.upDownCount', { up: sentiment.upCount, down: sentiment.downCount })}
                  </span>
                </p>
              )}
            </div>
            );
          })}
        </div>
      )}

      {insights && insights.recommendations.length > 0 && (
        <p className="mt-3 text-xs text-slate-500">
          {t('market.watchlistPrefix')}{' '}
          {insights.recommendations.slice(0, 2).map((rec, i) => (
            <span key={`${rec.market}-${rec.symbol}`}>
              {i > 0 && ' · '}
              {rec.name} ({translateTag(rec.tag, t)})
            </span>
          ))}
          {' — '}
          <Link href={marketAnalysisHref()} className="text-indigo-400 hover:text-indigo-300">
            {t('market.seeMoreInDetail')}
          </Link>
        </p>
      )}
    </section>
  );
}
