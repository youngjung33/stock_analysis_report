'use client';

import { PortfolioAnalysisResult } from '@/client/domain/models';
import { formatPercent, pnlClass } from '../shared/formatters';

interface Props {
  analysis: PortfolioAnalysisResult | undefined;
  isLoading: boolean;
}

export function PeriodReturnsCard({ analysis, isLoading }: Props) {
  if (isLoading) {
    return (
      <section className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
        <p className="text-sm text-slate-400">기간 수익률 불러오는 중...</p>
      </section>
    );
  }

  if (!analysis || analysis.portfolioReturns.length === 0) return null;

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 sm:p-6">
      <h2 className="text-sm font-semibold text-white">기간 수익률 (원화 가중)</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {analysis.portfolioReturns.map((item) => (
          <div key={item.period} className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
            <p className="text-xs text-slate-500">{item.label}</p>
            <p className={`mt-1 text-lg font-semibold ${pnlClass(item.returnPercent)}`}>
              {formatPercent(item.returnPercent)}
            </p>
            {item.coveragePercent < 100 && item.returnPercent !== null && (
              <p className="mt-1 text-xs text-slate-600">커버리지 {item.coveragePercent.toFixed(0)}%</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export function BenchmarkComparisonRow({ analysis }: { analysis: PortfolioAnalysisResult | undefined }) {
  if (!analysis || analysis.benchmarkComparisons.length === 0) return null;

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 sm:p-6">
      <h2 className="text-sm font-semibold text-white">벤치마크 대비</h2>
      <ul className="mt-3 space-y-2 text-sm">
        {analysis.benchmarkComparisons.map((row) => (
          <li key={row.period} className="flex flex-wrap items-center gap-x-2 text-slate-300">
            <span className="font-medium text-white">{row.label}</span>
            <span className={pnlClass(row.portfolioReturn)}>
              포트폴리오 {formatPercent(row.portfolioReturn)}
            </span>
            <span className="text-slate-500">vs {row.benchmarkName}</span>
            <span className={pnlClass(row.benchmarkReturn)}>
              {formatPercent(row.benchmarkReturn)}
            </span>
            {row.alpha !== null && (
              <span className={`font-medium ${pnlClass(row.alpha)}`}>
                ({row.alpha >= 0 ? '+' : ''}{row.alpha.toFixed(2)}%p)
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PortfolioInsightsSection({ analysis, isLoading }: Props) {
  if (isLoading) return null;
  if (!analysis || analysis.holdingsInsights.length === 0) {
    return (
      <section className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-400">
        보유 종목 인사이트가 없습니다.
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 sm:p-6">
      <h2 className="text-sm font-semibold text-white">보유 종목 RSI · 뉴스</h2>
      <ul className="mt-4 space-y-4">
        {analysis.holdingsInsights.map((item) => (
          <li key={`${item.symbol}-${item.market}`} className="rounded-lg border border-slate-800 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-white">{item.symbol}</span>
              <span className="text-xs text-slate-500">{item.name}</span>
              <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
                RSI {item.rsi14?.toFixed(1) ?? '—'} · {item.rsiLabel}
              </span>
            </div>
            {item.news.length > 0 && (
              <ul className="mt-2 space-y-1">
                {item.news.map((n) => (
                  <li key={n.url}>
                    <a
                      href={n.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-400 hover:text-indigo-300"
                    >
                      {n.title}
                    </a>
                    <span className="ml-1 text-xs text-slate-600">· {n.source}</span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
