'use client';

import {
  IndexTechnicalSnapshot,
  MacroIndicatorSnapshot,
  SectorEtfSnapshot,
} from '@sar/shared';
import { formatPercent, pnlClass } from '../../shared/formatters';

const MACRO_TONE_BORDER: Record<string, string> = {
  bullish: 'border-emerald-500/40',
  bearish: 'border-rose-500/40',
  neutral: 'border-slate-700',
};

function formatMacroValue(m: MacroIndicatorSnapshot): string {
  if (m.unit === 'krw') return `${m.value.toFixed(1)}원`;
  if (m.unit === 'pct') return `${m.value.toFixed(2)}%`;
  return m.value.toFixed(2);
}

export function MacroPanel({
  macro,
  compact,
}: {
  macro: MacroIndicatorSnapshot[];
  compact?: boolean;
}) {
  if (macro.length === 0) return null;

  const vix = macro.find((m) => m.kind === 'vix');
  const fx = macro.find((m) => m.kind === 'fx');
  const yields = macro.filter((m) => m.kind === 'yield');

  return (
    <div className="space-y-3">
      <div>
        <h3 className={`font-semibold text-white ${compact ? 'text-sm' : ''}`}>경기 · 변동성 · 환율 · 금리</h3>
        <p className="mt-0.5 text-xs text-slate-500">VIX · USD/KRW · 미국 국채 수익률</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {vix && (
          <MacroCard item={vix} compact={compact} highlight />
        )}
        {fx && <MacroCard item={fx} compact={compact} />}
      </div>

      {yields.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {yields.map((y) => (
            <MacroCard key={y.yahooSymbol} item={y} compact={compact} />
          ))}
        </div>
      )}
    </div>
  );
}

function MacroCard({
  item,
  compact,
  highlight,
}: {
  item: MacroIndicatorSnapshot;
  compact?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border bg-slate-950/50 p-4 ${MACRO_TONE_BORDER[item.tone]} ${highlight ? 'ring-1 ring-amber-500/20' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">{item.name}</p>
          <p className={`mt-1 font-semibold text-white ${compact ? 'text-lg' : 'text-xl'}`}>
            {formatMacroValue(item)}
          </p>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            item.tone === 'bullish'
              ? 'bg-emerald-500/20 text-emerald-300'
              : item.tone === 'bearish'
                ? 'bg-rose-500/20 text-rose-300'
                : 'bg-slate-700 text-slate-300'
          }`}
        >
          {item.interpretLabel}
        </span>
      </div>
      <p className={`mt-1 text-xs ${pnlClass(item.changePercent1d)}`}>
        1일 {formatPercent(item.changePercent1d)}
      </p>
      <p className="mt-2 text-[11px] leading-relaxed text-slate-400">{item.interpretDetail}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <a
          href={item.chartUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded border border-slate-700 px-2 py-0.5 text-[10px] text-indigo-300 hover:bg-slate-800"
        >
          Yahoo ↗
        </a>
        {item.tradingViewUrl && (
          <a
            href={item.tradingViewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded border border-slate-700 px-2 py-0.5 text-[10px] text-indigo-300 hover:bg-slate-800"
          >
            TradingView ↗
          </a>
        )}
      </div>
    </div>
  );
}

export function IndexTechnicalPanel({
  indices,
  compact,
}: {
  indices: IndexTechnicalSnapshot[];
  compact?: boolean;
}) {
  if (indices.length === 0) return null;

  return (
    <div className="space-y-3">
      <div>
        <h3 className={`font-semibold text-white ${compact ? 'text-sm' : ''}`}>주요 지수 · 기술적 지표</h3>
        <p className="mt-0.5 text-xs text-slate-500">SMA · RSI · MACD · 볼린저 · 스토캐스틱</p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="min-w-full text-left text-xs">
          <thead className="bg-slate-900/90 text-[10px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2.5">지수</th>
              <th className="px-3 py-2.5">가격</th>
              <th className="px-3 py-2.5">1일</th>
              <th className="px-3 py-2.5">SMA20/50</th>
              <th className="px-3 py-2.5">RSI</th>
              <th className="px-3 py-2.5">MACD</th>
              <th className="px-3 py-2.5">볼린저</th>
              <th className="px-3 py-2.5">Stoch</th>
              <th className="px-3 py-2.5">추세</th>
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {indices.map((idx) => (
              <tr key={idx.yahooSymbol} className="border-t border-slate-800/80 hover:bg-slate-900/40">
                <td className="px-3 py-2.5 font-medium text-white">{idx.name}</td>
                <td className="px-3 py-2.5 text-slate-200">{idx.currentPrice.toLocaleString()}</td>
                <td className={`px-3 py-2.5 ${pnlClass(idx.changePercent1d)}`}>
                  {formatPercent(idx.changePercent1d)}
                </td>
                <td className="px-3 py-2.5 text-slate-400">
                  {idx.sma20?.toFixed(0) ?? '—'} / {idx.sma50?.toFixed(0) ?? '—'}
                </td>
                <td className="px-3 py-2.5 text-slate-300">{idx.rsi14?.toFixed(1) ?? '—'}</td>
                <td className={`px-3 py-2.5 ${idx.macd !== null ? (idx.macd >= 0 ? 'text-emerald-400' : 'text-rose-400') : 'text-slate-500'}`}>
                  {idx.macd?.toFixed(2) ?? '—'}
                </td>
                <td className="px-3 py-2.5 text-slate-300">
                  {idx.bollinger ? idx.bollinger.label : '—'}
                </td>
                <td className="px-3 py-2.5 text-slate-300">
                  {idx.stochastic ? `${idx.stochastic.k.toFixed(0)}/${idx.stochastic.d.toFixed(0)}` : '—'}
                </td>
                <td className="px-3 py-2.5 text-slate-300">{idx.trendLabel}</td>
                <td className="px-3 py-2.5">
                  <a
                    href={idx.chartUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300"
                  >
                    ↗
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function rsBarWidth(rs: number | null): number {
  if (rs === null) return 0;
  return Math.min(100, Math.max(0, 50 + rs * 10));
}

export function SectorStrengthPanel({
  sectors,
  compact,
}: {
  sectors: SectorEtfSnapshot[];
  compact?: boolean;
}) {
  if (sectors.length === 0) return null;

  const us = sectors.filter((s) => s.market === 'US');
  const kr = sectors.filter((s) => s.market === 'KR');

  return (
    <div className="space-y-4">
      <div>
        <h3 className={`font-semibold text-white ${compact ? 'text-sm' : ''}`}>업종 ETF 상대강도</h3>
        <p className="mt-0.5 text-xs text-slate-500">1주·1달 수익률 — SPY / KODEX 200 대비 자금 이동 관찰</p>
      </div>
      <SectorGroup title="🇺🇸 미국" sectors={us} benchmark="SPY" />
      <SectorGroup title="🇰🇷 한국" sectors={kr} benchmark="KODEX200" />
    </div>
  );
}

function SectorGroup({
  title,
  sectors,
  benchmark,
}: {
  title: string;
  sectors: SectorEtfSnapshot[];
  benchmark: string;
}) {
  if (sectors.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-4">
      <p className="text-xs font-medium text-slate-400">
        {title} · 기준지수 {benchmark}
      </p>
      <ul className="mt-3 space-y-3">
        {sectors.map((s) => (
          <li key={s.yahooSymbol}>
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="min-w-0 flex-1">
                <span className="font-medium text-white">{s.sectorLabel}</span>
                <span className="ml-2 text-slate-500">{s.name}</span>
              </div>
              <div className="shrink-0 text-right">
                <span className={`font-medium ${pnlClass(s.rsBenchmark1w)}`}>
                  1주 {formatPercent(s.rsBenchmark1w)}
                </span>
                <span className="ml-2 text-slate-500">당일 {formatPercent(s.changePercent1d)}</span>
              </div>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full rounded-full transition-all ${
                  (s.rsBenchmark1w ?? 0) >= 0 ? 'bg-emerald-500/70' : 'bg-rose-500/70'
                }`}
                style={{ width: `${rsBarWidth(s.rsBenchmark1w)}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-slate-600">
              <span>{s.strengthLabel} · #{s.strengthRank}</span>
              <a
                href={s.chartUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300"
              >
                차트 ↗
              </a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
