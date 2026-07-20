'use client';

import { PortfolioAnalysisResult } from '@/client/domain/models';
import { Surface } from '../design-system';
import { formatPercent, pnlClass } from '../shared/formatters';

interface Props {
  analysis: PortfolioAnalysisResult | undefined;
  isLoading: boolean;
}

export function PeriodReturnsCard({ analysis, isLoading }: Props) {
  if (isLoading) {
    return (
      <Surface>
        <p className="text-sm text-muted-foreground">기간 수익률 불러오는 중...</p>
      </Surface>
    );
  }

  if (!analysis || analysis.portfolioReturns.length === 0) return null;

  return (
    <Surface>
      <h2 className="text-base font-semibold tracking-tight">기간 수익률 (원화 가중)</h2>
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {analysis.portfolioReturns.map((item) => (
          <Surface key={item.period} variant="card" as="div">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className={`mt-2 text-lg font-semibold ${pnlClass(item.returnPercent)}`}>
              {formatPercent(item.returnPercent)}
            </p>
            {item.coveragePercent < 100 && item.returnPercent !== null && (
              <p className="mt-2 text-xs text-muted-foreground">
                시세 반영률 {item.coveragePercent.toFixed(0)}%
              </p>
            )}
          </Surface>
        ))}
      </div>
    </Surface>
  );
}

export function BenchmarkComparisonRow({ analysis }: { analysis: PortfolioAnalysisResult | undefined }) {
  if (!analysis || analysis.benchmarkComparisons.length === 0) return null;

  return (
    <Surface>
      <h2 className="text-base font-semibold tracking-tight">지수 대비 수익률</h2>
      <ul className="mt-5 space-y-3 text-sm">
        {analysis.benchmarkComparisons.map((row) => (
          <li key={row.period} className="flex flex-wrap items-center gap-x-2 text-muted-foreground">
            <span className="font-medium text-foreground">{row.label}</span>
            <span className={pnlClass(row.portfolioReturn)}>
              내 수익률 {formatPercent(row.portfolioReturn)}
            </span>
            <span className="text-muted-foreground">· {row.benchmarkName}</span>
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
    </Surface>
  );
}

export function PortfolioInsightsSection({ analysis, isLoading }: Props) {
  if (isLoading) return null;
  if (!analysis || analysis.holdingsInsights.length === 0) {
    return (
      <Surface variant="subtle" className="border-dashed text-center text-sm text-muted-foreground">
        보유 종목 분석 정보가 없습니다.
      </Surface>
    );
  }

  return (
    <Surface>
      <h2 className="text-base font-semibold tracking-tight">보유 종목 차트·뉴스</h2>
      <ul className="mt-6 space-y-4">
        {analysis.holdingsInsights.map((item) => (
          <li key={`${item.symbol}-${item.market}`} className="rounded-xl border border-border bg-muted/20 p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-foreground">{item.symbol}</span>
              <span className="text-xs text-muted-foreground">{item.name}</span>
              <span className="rounded-md bg-accent px-2.5 py-1 text-xs text-muted-foreground">
                RSI {item.rsi14?.toFixed(1) ?? '—'} · {item.rsiLabel}
              </span>
            </div>
            {item.news.length > 0 && (
              <ul className="mt-3 space-y-2">
                {item.news.map((n) => (
                  <li key={n.url}>
                    <a
                      href={n.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:opacity-80"
                    >
                      {n.title}
                    </a>
                    <span className="ml-1 text-xs text-muted-foreground">· {n.source}</span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </Surface>
  );
}
