import { Market } from './enums';
import { changePercentOverBars } from './technical-analysis';

export interface SectorSeriesInput {
  yahooSymbol: string;
  name: string;
  sectorLabel: string;
  market: Market;
  closes: number[];
  changePercent1d: number | null;
  chartUrl: string;
  benchmarkCloses: number[];
}

export interface SectorEtfSnapshot {
  yahooSymbol: string;
  name: string;
  sectorLabel: string;
  market: Market;
  currentPrice: number;
  changePercent1d: number | null;
  changePercent1w: number | null;
  changePercent1mo: number | null;
  rsBenchmark1w: number | null;
  rsBenchmark1mo: number | null;
  /** @deprecated use strengthKey */
  strengthLabel: string;
  strengthKey: string;
  strengthRank: number;
  chartUrl: string;
}

function strengthFromRs(rs1w: number | null, rs1mo: number | null): { label: string; key: string } {
  const rs = rs1w ?? rs1mo ?? 0;
  if (rs >= 2) return { label: '강함', key: 'shared.market.strength.strong' };
  if (rs <= -2) return { label: '약함', key: 'shared.market.strength.weak' };
  return { label: '보통', key: 'shared.market.strength.normal' };
}

export function buildSectorSnapshot(input: SectorSeriesInput): SectorEtfSnapshot | null {
  const { closes, benchmarkCloses } = input;
  if (closes.length < 2) return null;

  const currentPrice = closes[closes.length - 1];
  const change1w = changePercentOverBars(closes, 5);
  const change1mo = changePercentOverBars(closes, 21);
  const bench1w = changePercentOverBars(benchmarkCloses, 5);
  const bench1mo = changePercentOverBars(benchmarkCloses, 21);

  const rs1w = change1w !== null && bench1w !== null ? change1w - bench1w : null;
  const rs1mo = change1mo !== null && bench1mo !== null ? change1mo - bench1mo : null;
  const strength = strengthFromRs(rs1w, rs1mo);

  return {
    yahooSymbol: input.yahooSymbol,
    name: input.name,
    sectorLabel: input.sectorLabel,
    market: input.market,
    currentPrice,
    changePercent1d: input.changePercent1d,
    changePercent1w: change1w,
    changePercent1mo: change1mo,
    rsBenchmark1w: rs1w,
    rsBenchmark1mo: rs1mo,
    strengthLabel: strength.label,
    strengthKey: strength.key,
    strengthRank: 0,
    chartUrl: input.chartUrl,
  };
}

export function rankSectorSnapshots(sectors: SectorEtfSnapshot[]): SectorEtfSnapshot[] {
  const sorted = [...sectors].sort((a, b) => (b.rsBenchmark1w ?? 0) - (a.rsBenchmark1w ?? 0));
  return sorted.map((s, i) => ({ ...s, strengthRank: i + 1 }));
}

export function groupSectorsByMarket(sectors: SectorEtfSnapshot[]): {
  us: SectorEtfSnapshot[];
  kr: SectorEtfSnapshot[];
} {
  return {
    us: sectors.filter((s) => s.market === Market.US),
    kr: sectors.filter((s) => s.market === Market.KR),
  };
}
