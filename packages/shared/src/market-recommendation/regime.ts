import { Market } from '../enums';
import type { MacroIndicatorSnapshot } from '../market-macro';
import type { RecommendationTag, RegionSentiment } from '../market-sentiment';
import type { MarketContext, MarketRegime, MarketRegimeId, IndexContextSnapshot } from './types';

function isBullish(label: RegionSentiment['label']): boolean {
  return label === 'strong_bull' || label === 'bull';
}

function isBearish(label: RegionSentiment['label']): boolean {
  return label === 'bear' || label === 'strong_bear';
}

function findMacro(macro: MacroIndicatorSnapshot[], kind: MacroIndicatorSnapshot['kind']) {
  return macro.find((m) => m.kind === kind);
}

export function detectMarketRegimes(input: {
  krSentiment: RegionSentiment;
  usSentiment: RegionSentiment;
  macro: MacroIndicatorSnapshot[];
  usdKrwChange1d: number | null;
}): MarketRegime[] {
  const regimes: MarketRegime[] = [];
  const vix = findMacro(input.macro, 'vix');
  const vixValue = vix?.value ?? null;

  const krAvg = input.krSentiment.avgChangePercent ?? 0;
  const usAvg = input.usSentiment.avgChangePercent ?? 0;
  const gap = Math.abs(krAvg - usAvg);

  if (vixValue !== null && vixValue >= 20) {
    regimes.push({ id: 'globalRiskOff', labelKey: 'shared.market.regime.globalRiskOff' });
  } else if (vixValue !== null && vixValue <= 15 && isBullish(input.usSentiment.label)) {
    regimes.push({ id: 'globalRiskOn', labelKey: 'shared.market.regime.globalRiskOn' });
  }

  const fxChange = input.usdKrwChange1d ?? 0;
  if (fxChange > 0.2) {
    regimes.push({ id: 'fxKrwWeak', labelKey: 'shared.market.regime.fxKrwWeak' });
  } else if (fxChange < -0.2) {
    regimes.push({ id: 'fxKrwStrong', labelKey: 'shared.market.regime.fxKrwStrong' });
  }

  if (isBullish(input.usSentiment.label) && !isBullish(input.krSentiment.label) && gap > 1) {
    regimes.push({ id: 'usLeadingKr', labelKey: 'shared.market.regime.usLeadingKr' });
  }

  if (isBullish(input.krSentiment.label) && isBullish(input.usSentiment.label)) {
    regimes.push({ id: 'syncBull', labelKey: 'shared.market.regime.syncBull' });
  } else if (isBearish(input.krSentiment.label) && isBearish(input.usSentiment.label)) {
    regimes.push({ id: 'syncBear', labelKey: 'shared.market.regime.syncBear' });
  }

  if (gap > 1 && !regimes.some((r) => r.id === 'usLeadingKr')) {
    regimes.push({ id: 'diverged', labelKey: 'shared.market.regime.diverged' });
  }

  return regimes;
}

export function buildMarketContext(input: {
  krSentiment: RegionSentiment;
  usSentiment: RegionSentiment;
  macro?: MacroIndicatorSnapshot[];
  sectors?: import('../market-sector').SectorEtfSnapshot[];
  indices?: IndexContextSnapshot[];
  usdKrwRate?: number | null;
  usdKrwChange1d?: number | null;
  preferredTags?: RecommendationTag[];
  userHoldings?: Array<{ symbol: string; market: Market }>;
  userWatchlist?: Array<{ symbol: string; market: Market }>;
}): MarketContext {
  const macro = input.macro ?? [];
  const sectors = input.sectors ?? [];
  const regimes = detectMarketRegimes({
    krSentiment: input.krSentiment,
    usSentiment: input.usSentiment,
    macro,
    usdKrwChange1d: input.usdKrwChange1d ?? null,
  });

  const leadingKrSectors = sectors
    .filter((s) => s.market === Market.KR)
    .sort((a, b) => (b.rsBenchmark1w ?? 0) - (a.rsBenchmark1w ?? 0))
    .slice(0, 2)
    .map((s) => s.sectorLabel);

  const leadingUsSectors = sectors
    .filter((s) => s.market === Market.US)
    .sort((a, b) => (b.rsBenchmark1w ?? 0) - (a.rsBenchmark1w ?? 0))
    .slice(0, 2)
    .map((s) => s.sectorLabel);

  const heldSymbols = new Set(
    (input.userHoldings ?? []).map((h) => `${h.market}:${h.symbol.toUpperCase()}`),
  );
  const watchlistSymbols = new Set(
    (input.userWatchlist ?? []).map((w) => `${w.market}:${w.symbol.toUpperCase()}`),
  );

  return {
    krSentiment: input.krSentiment,
    usSentiment: input.usSentiment,
    regimes,
    macro,
    sectors,
    indices: input.indices ?? [],
    usdKrwRate: input.usdKrwRate ?? null,
    usdKrwChange1d: input.usdKrwChange1d ?? null,
    preferredTags: input.preferredTags ?? [],
    heldSymbols,
    watchlistSymbols,
    leadingKrSectors,
    leadingUsSectors,
  };
}

export function hasRegime(ctx: MarketContext, id: MarketRegimeId): boolean {
  return ctx.regimes.some((r) => r.id === id);
}

export function regimeIds(ctx: MarketContext): MarketRegimeId[] {
  return ctx.regimes.map((r) => r.id);
}
