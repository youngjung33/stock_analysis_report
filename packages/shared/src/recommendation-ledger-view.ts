import { Market } from './enums';
import type {
  RecommendationBatchView,
  RecommendationItemView,
  RecommendationOutcomeView,
} from './recommendation-ledger';

type CandidatePoolEntry = { symbol: string; market: Market; name?: string };

export function catalogDisplayNameKey(market: Market, symbol: string): string {
  return `${market}:${symbol.toUpperCase()}`;
}

export function lookupCandidatePoolName(
  candidatePool: unknown,
  symbol: string,
  market: Market,
): string | undefined {
  if (!Array.isArray(candidatePool)) return undefined;
  const upper = symbol.toUpperCase();
  for (const entry of candidatePool) {
    if (!entry || typeof entry !== 'object') continue;
    const e = entry as CandidatePoolEntry;
    if (e.market === market && String(e.symbol).toUpperCase() === upper) {
      return e.name;
    }
  }
  return undefined;
}

/** 과거 배치: candidatePool 스냅샷에 name이 없을 때만 catalog 조회 필요 */
export function itemNeedsCatalogDisplayName(
  item: { symbol: string; market: Market },
  candidatePool: unknown,
): boolean {
  const poolName = lookupCandidatePoolName(candidatePool, item.symbol, item.market);
  return !poolName || poolName === item.symbol;
}

export function collectSymbolsNeedingCatalogNames(
  batches: RecommendationBatchEntityLike[],
): { kr: string[]; us: string[] } {
  const kr = new Set<string>();
  const us = new Set<string>();
  for (const batch of batches) {
    const pool = batch.candidatePool ?? null;
    for (const item of batch.items ?? []) {
      if (!itemNeedsCatalogDisplayName(item, pool)) continue;
      if (item.market === Market.KR) kr.add(item.symbol);
      else us.add(item.symbol);
    }
  }
  return { kr: [...kr], us: [...us] };
}

export interface RecommendationItemEntityLike {
  id: string;
  rank: number;
  symbol: string;
  market: Market;
  tag: string;
  score: number;
  priceAtRun: number;
  changePercent1d: number | null;
  outcomes?: Array<{
    id: string;
    horizon: RecommendationOutcomeView['horizon'];
    evaluatedAt: Date | string;
    returnPercent: number;
    benchmarkReturn: number | null;
    alphaVsBenchmark: number | null;
  }>;
}

export interface RecommendationBatchEntityLike {
  id: string;
  runAt: Date | string;
  tradingDate: string;
  engineVersion: string;
  profileKey: string;
  regimes: unknown;
  items?: RecommendationItemEntityLike[];
  candidatePool?: unknown;
}

function toOutcomeView(o: NonNullable<RecommendationItemEntityLike['outcomes']>[number]): RecommendationOutcomeView {
  return {
    id: o.id,
    horizon: o.horizon,
    evaluatedAt: typeof o.evaluatedAt === 'string' ? o.evaluatedAt : o.evaluatedAt.toISOString(),
    returnPercent: o.returnPercent,
    benchmarkReturn: o.benchmarkReturn,
    alphaVsBenchmark: o.alphaVsBenchmark,
  };
}

export function mapRecommendationItemToView(
  item: RecommendationItemEntityLike,
  candidatePool: unknown,
  catalogNames?: ReadonlyMap<string, string>,
): RecommendationItemView {
  const poolName = lookupCandidatePoolName(candidatePool, item.symbol, item.market);
  const catalogName = catalogNames?.get(catalogDisplayNameKey(item.market, item.symbol));
  const name =
    poolName && poolName !== item.symbol
      ? poolName
      : catalogName ?? poolName ?? item.symbol;
  return {
    id: item.id,
    rank: item.rank,
    symbol: item.symbol,
    market: item.market,
    name,
    tag: item.tag,
    score: item.score,
    priceAtRun: item.priceAtRun,
    changePercent1d: item.changePercent1d,
    outcomes: (item.outcomes ?? []).map(toOutcomeView),
  };
}

export function mapRecommendationBatchToView(
  batch: RecommendationBatchEntityLike,
  catalogNames?: ReadonlyMap<string, string>,
): RecommendationBatchView {
  const candidatePool = batch.candidatePool ?? null;
  return {
    id: batch.id,
    runAt: typeof batch.runAt === 'string' ? batch.runAt : batch.runAt.toISOString(),
    tradingDate: batch.tradingDate,
    engineVersion: batch.engineVersion,
    profileKey: batch.profileKey,
    regimes: batch.regimes,
    items: (batch.items ?? []).map((item) =>
      mapRecommendationItemToView(item, candidatePool, catalogNames),
    ),
  };
}
