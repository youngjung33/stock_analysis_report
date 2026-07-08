'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ANALYSIS_CATEGORY_LABEL,
  AnalysisCategory,
  AnalysisInsight,
  AnalysisTone,
  MarketAnalysisReport,
  SENTIMENT_LABEL_KO,
  sentimentBadgeClass,
} from '@sar/shared';
import { useMarketAnalysis } from '../hooks/useMarketAnalysis';
import { useErrorToast } from '../hooks/useErrorToast';
import { formatPercent, pnlClass } from '../shared/formatters';
import { stockDetailHref } from '../shared/stock-routes';
import {
  IndexTechnicalPanel,
  MacroPanel,
  SectorStrengthPanel,
} from './market-analysis/MarketAnalysisPanels';

interface Props {
  compact?: boolean;
}

const TONE_STYLE: Record<AnalysisTone, string> = {
  bullish: 'border-emerald-500/30 bg-emerald-500/5',
  bearish: 'border-rose-500/30 bg-rose-500/5',
  neutral: 'border-slate-700 bg-slate-950/40',
};

const CATEGORY_ORDER: AnalysisCategory[] = [
  'macro',
  'breadth',
  'index',
  'sector',
  'technical',
  'news',
  'recommendation',
];

function SentimentSummary({ report, compact }: { report: MarketAnalysisReport; compact?: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {[report.kr, report.us].map((sentiment) => (
        <div key={sentiment.market} className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={`font-semibold text-white ${compact ? 'text-sm' : ''}`}>{sentiment.headline}</h3>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${sentimentBadgeClass(sentiment.label)}`}
            >
              {SENTIMENT_LABEL_KO[sentiment.label]}
            </span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">{sentiment.description}</p>
          {sentiment.avgChangePercent !== null && (
            <p className={`mt-2 text-sm font-medium ${pnlClass(sentiment.avgChangePercent)}`}>
              평균 등락 {formatPercent(sentiment.avgChangePercent)}
              <span className="ml-2 text-xs font-normal text-slate-500">
                ↑{sentiment.upCount} ↓{sentiment.downCount}
              </span>
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function InsightCard({ item, compact }: { item: AnalysisInsight; compact?: boolean }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article className={`rounded-xl border p-4 ${TONE_STYLE[item.tone]}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
            {item.categoryLabel}
          </span>
          <h4 className={`mt-1 font-medium text-white ${compact ? 'text-sm' : 'text-base'}`}>
            {item.title}
          </h4>
          <p className="mt-1 text-xs text-slate-400">{item.summary}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mt-3 text-xs text-indigo-400 hover:text-indigo-300"
      >
        {expanded ? '분석 접기 ▲' : '왜 그렇게 보는지 · 근거 ▼'}
      </button>
      {expanded && (
        <div className="mt-3 space-y-3 border-t border-slate-800/80 pt-3">
          <p className="text-xs leading-relaxed text-slate-300">{item.reasoning}</p>
          <ul className="list-inside list-disc space-y-0.5 text-xs text-slate-400">
            {item.evidence.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            {item.links.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-slate-700 bg-slate-900/60 px-2 py-1 text-[10px] text-indigo-300 hover:border-indigo-500/50"
              >
                {link.label} ↗
              </a>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

function NewsList({ news }: { news: MarketAnalysisReport['news'] }) {
  if (news.length === 0) return null;
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-4">
      <h3 className="text-sm font-semibold text-white">최신 헤드라인</h3>
      <ul className="mt-3 space-y-2">
        {news.slice(0, 8).map((item) => (
          <li key={item.url + item.title} className="text-xs">
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-indigo-300">
              {item.title}
            </a>
            <span className="ml-2 text-slate-600">
              {item.source} · {new Date(item.publishedAt).toLocaleString('ko-KR')}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MarketAnalysisDetailSection({ compact }: Props) {
  const { data, isLoading, isError } = useMarketAnalysis();

  useErrorToast(isError, '시장 분석을 불러오지 못했습니다.');

  const groupedInsights = useMemo(() => {
    if (!data) return [];
    const map = new Map<AnalysisCategory, AnalysisInsight[]>();
    for (const item of data.insights) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return CATEGORY_ORDER.filter((c) => map.has(c)).map((c) => ({
      category: c,
      label: ANALYSIS_CATEGORY_LABEL[c],
      items: map.get(c)!,
    }));
  }, [data]);

  const narrativeGroups = groupedInsights.filter(
    (g) => !['macro', 'index', 'sector', 'technical'].includes(g.category),
  );

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">시장 정세 · 심층 분석</h2>
        <p className="mt-1 text-xs text-slate-500">
          VIX · 환율 · 국채 · 섹터 RS · SMA/RSI/MACD/볼린저/스토캐스틱 · 뉴스
          {data?.fetchedAt && (
            <span className="ml-1 text-slate-600">· {new Date(data.fetchedAt).toLocaleString('ko-KR')}</span>
          )}
        </p>
      </div>

      {isLoading && (
        <p className="text-sm text-slate-400">매크로·지수·섹터·뉴스 분석 중… (최대 25초)</p>
      )}

      {data && (
        <>
          <SentimentSummary report={data} compact={compact} />
          <MacroPanel macro={data.macro} compact={compact} />
          <IndexTechnicalPanel indices={data.indices} compact={compact} />
          <SectorStrengthPanel sectors={data.sectors} compact={compact} />

          {narrativeGroups.map((group) => (
            <div key={group.category} className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-300">{group.label}</h3>
              <div className="space-y-3">
                {group.items.map((item) => (
                  <InsightCard key={item.id} item={item} compact={compact} />
                ))}
              </div>
            </div>
          ))}

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-300">지표별 상세 해석</h3>
            <div className="space-y-3">
              {groupedInsights
                .filter((g) =>
                  ['macro', 'technical', 'index', 'sector'].includes(g.category),
                )
                .flatMap((g) => g.items)
                .map((item) => (
                  <InsightCard key={item.id} item={item} compact={compact} />
                ))}
            </div>
          </div>

          <NewsList news={data.news} />

          {data.recommendations.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-300">종목 바로가기</h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {data.recommendations.map((rec) => (
                  <Link
                    key={`${rec.market}-${rec.symbol}`}
                    href={stockDetailHref(rec.symbol, rec.market)}
                    className="rounded-lg border border-slate-800 px-3 py-2 text-xs text-slate-300 hover:border-indigo-500/40"
                  >
                    {rec.tagLabel} · {rec.name} ({formatPercent(rec.changePercent)})
                  </Link>
                ))}
              </div>
            </div>
          )}

          <p className="text-[11px] leading-relaxed text-slate-600">
            Yahoo Finance·Google News·Finnhub(선택) 기반 참고용 분석이며 투자 권유가 아닙니다.
          </p>
        </>
      )}
    </section>
  );
}
