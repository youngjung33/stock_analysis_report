'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { sentimentBadgeClass } from '@sar/shared';
import { translateRegionSentiment, translateSentiment, translateTag, translateRegime } from '@/i18n/translate-shared';
import { useMarketSentimentSummary } from '../hooks/useMarketSentimentSummary';
import { formatNumber, formatPercent, pnlClass } from '../shared/formatters';
import { marketAnalysisHref } from '../shared/stock-routes';

interface Props {
  compact?: boolean;
}

export function MarketSentimentSummarySection({ compact }: Props) {
  const { t } = useTranslation();
  const { data, isLoading } = useMarketSentimentSummary();

  const insights = data?.insights ?? null;

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

      {insights && insights.regimes && insights.regimes.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-xs text-slate-500">{t('market.regimeTitle')}:</span>
          {insights.regimes.map((regime) => (
            <span
              key={regime.id}
              className="rounded-full border border-indigo-500/40 bg-indigo-950/40 px-2 py-0.5 text-[10px] font-medium text-indigo-200"
            >
              {translateRegime(regime.id, t)}
            </span>
          ))}
        </div>
      )}

      {insights && data?.indices && data.indices.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {data.indices.map((index) => {
            const sentiment = index.market === 'KR' ? insights.kr : insights.us;
            const localized = translateRegionSentiment(sentiment, t);
            return (
              <div
                key={index.yahooSymbol}
                className="rounded-lg border border-slate-800/80 bg-slate-900/40 p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className={`font-semibold text-white ${compact ? 'text-sm' : 'text-base'}`}>
                    {index.name}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${sentimentBadgeClass(sentiment.label)}`}
                  >
                    {translateSentiment(sentiment.label, t)}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  {index.currentPrice !== null && (
                    <span
                      className={`font-semibold text-white ${compact ? 'text-lg' : 'text-xl'}`}
                    >
                      {formatNumber(index.currentPrice)}
                    </span>
                  )}
                  {index.changePercent1d !== null ? (
                    <span
                      className={`font-semibold ${compact ? 'text-base' : 'text-lg'} ${pnlClass(index.changePercent1d)}`}
                    >
                      {formatPercent(index.changePercent1d)}
                    </span>
                  ) : (
                    index.currentPrice === null && (
                      <span className="text-sm text-slate-500">{t('common.dash')}</span>
                    )
                  )}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">{localized.description}</p>
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
