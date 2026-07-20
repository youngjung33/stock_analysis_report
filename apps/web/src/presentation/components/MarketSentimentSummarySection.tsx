'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { buildMarketInsights, SENTIMENT_LABEL_KO, sentimentBadgeClass } from '@sar/shared';
import { useFeaturedQuotes } from '../hooks/useFeaturedQuotes';
import { formatPercent, pnlClass } from '../shared/formatters';
import { marketAnalysisHref } from '../shared/stock-routes';

interface Props {
  compact?: boolean;
}

export function MarketSentimentSummarySection({ compact }: Props) {
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
            시장 정세 요약
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            대표 종목 오늘 시세 기준 · 변동성·업종·차트 지표는 상세 페이지
          </p>
        </div>
        <Link
          href={marketAnalysisHref()}
          className="shrink-0 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-500 sm:text-sm"
        >
          상세 분석 →
        </Link>
      </div>

      {isLoading && <p className="mt-4 text-sm text-slate-400">시세 불러오는 중...</p>}

      {insights && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[insights.kr, insights.us].map((sentiment) => (
            <div
              key={sentiment.market}
              className="rounded-lg border border-slate-800/80 bg-slate-900/40 p-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className={`font-medium text-slate-200 ${compact ? 'text-sm' : ''}`}>
                  {sentiment.market === 'KR' ? '🇰🇷 한국' : '🇺🇸 미국'}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${sentimentBadgeClass(sentiment.label)}`}
                >
                  {SENTIMENT_LABEL_KO[sentiment.label]}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">{sentiment.description}</p>
              {sentiment.avgChangePercent !== null && (
                <p className={`mt-2 text-sm font-medium ${pnlClass(sentiment.avgChangePercent)}`}>
                  평균 {formatPercent(sentiment.avgChangePercent)}
                  <span className="ml-2 text-xs font-normal text-slate-500">
                    ↑{sentiment.upCount} ↓{sentiment.downCount}
                  </span>
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {insights && insights.recommendations.length > 0 && (
        <p className="mt-3 text-xs text-slate-500">
          관심 종목:{' '}
          {insights.recommendations.slice(0, 2).map((rec, i) => (
            <span key={`${rec.market}-${rec.symbol}`}>
              {i > 0 && ' · '}
              {rec.name} ({rec.tagLabel})
            </span>
          ))}
          {' — '}
          <Link href={marketAnalysisHref()} className="text-indigo-400 hover:text-indigo-300">
            상세에서 더 보기
          </Link>
        </p>
      )}
    </section>
  );
}
