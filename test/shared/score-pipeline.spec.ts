import { describe, expect, it } from 'vitest';
import { Market } from '@sar/shared';
import {
  applyEnrichmentCaps,
  applyEnrichmentDedupe,
  applyScorePipeline,
  enrichmentFactor,
  ENRICHMENT_SCORE_CAPS,
  figureLinkScopeAllowsSymbolDelta,
  scoreKrCandidate,
} from '@sar/shared';
import type { MarketContext, ScoreBreakdownItem } from '@sar/shared';

function baseBreakdown(): ScoreBreakdownItem[] {
  return [
    {
      factor: 'change1d',
      delta: 0.12,
      evidenceKey: 'shared.market.recommendation.evidence.change1d',
    },
    {
      factor: 'globalRiskOn',
      delta: 0.3,
      evidenceKey: 'shared.market.recommendation.evidence.globalRiskOn',
    },
  ];
}

function sumAbsEnrichment(breakdown: ScoreBreakdownItem[]): number {
  return breakdown
    .filter((b) => b.factor.startsWith('CH_'))
    .reduce((s, b) => s + Math.abs(b.delta), 0);
}

function sumAbsT3(breakdown: ScoreBreakdownItem[]): number {
  return breakdown
    .filter((b) => b.factor.startsWith('CH_NEWS:') || b.factor.startsWith('CH_NARRATIVE:'))
    .reduce((s, b) => s + Math.abs(b.delta), 0);
}

function deltaOf(breakdown: ScoreBreakdownItem[], prefix: string): number {
  return breakdown.find((b) => b.factor.startsWith(prefix))?.delta ?? 0;
}

describe('score-pipeline (G0 / appendix D)', () => {
  describe('FIX_v1_parity (INV-10)', () => {
    it('applyEnrichmentDedupe + caps leave base-only breakdown unchanged', () => {
      const breakdown = baseBreakdown();
      const score = 1.42;
      const deduped = applyEnrichmentDedupe(breakdown, score);
      const result = applyEnrichmentCaps(deduped.breakdown, deduped.score);
      expect(result.score).toBeCloseTo(score, 8);
      expect(result.breakdown).toEqual(breakdown);
    });

    it('scoreKrCandidate score unchanged vs pre-pipeline (enrichment empty)', () => {
      const ctx = minimalKrContext();
      const quote = {
        symbol: '005930',
        name: 'Samsung',
        market: Market.KR,
        currency: 'KRW',
        currentPrice: 70000,
        changePercent: 1.5,
      };
      const rec = scoreKrCandidate(quote, ctx);
      expect(rec).not.toBeNull();
      expect(rec!.scoreBreakdown?.some((b) => b.factor.startsWith('CAP_TRIM'))).toBe(false);
      expect(rec!.score).toBeGreaterThan(0);
    });
  });

  describe('FIX_cap_overflow (INV-1, INV-2, INV-12)', () => {
    it('trims enrichment sum and adds CAP_TRIM rows', () => {
      const breakdown: ScoreBreakdownItem[] = [
        ...baseBreakdown(),
        enrichmentFactor('CH_TECH', 'rsiBreakout', 0.35, 'ev.tech'),
        enrichmentFactor('CH_EVENT', 'earningsBeat', 0.35, 'ev.event'),
        enrichmentFactor('CH_NEWS', 'headlineA', 0.12, 'ev.news1'),
        enrichmentFactor('CH_NEWS', 'headlineB', 0.12, 'ev.news2'),
      ];
      const score = breakdown.reduce((s, b) => s + b.delta, 0);
      const deduped = applyEnrichmentDedupe(breakdown, score);
      const result = applyEnrichmentCaps(deduped.breakdown, deduped.score);

      expect(sumAbsEnrichment(result.breakdown)).toBeLessThanOrEqual(
        ENRICHMENT_SCORE_CAPS.maxAbsEnrichmentSum + 1e-9,
      );
      expect(sumAbsT3(result.breakdown)).toBeLessThanOrEqual(
        ENRICHMENT_SCORE_CAPS.maxAbsTier3Sum + 1e-9,
      );
      expect(result.breakdown.some((b) => b.factor.startsWith('CAP_TRIM:'))).toBe(true);
      expect(result.breakdown.filter((b) => b.factor === 'change1d')).toHaveLength(1);
    });

    it('clamps single T2/T3 factor magnitudes (INV-3, INV-4)', () => {
      const breakdown: ScoreBreakdownItem[] = [
        enrichmentFactor('CH_TECH', 'oversized', 0.9, 'ev.tech'),
        enrichmentFactor('CH_NEWS', 'oversizedNews', 0.4, 'ev.news'),
      ];
      const score = 1.3;
      const result = applyEnrichmentCaps(breakdown, score);
      const tech = result.breakdown.find((b) => b.factor.includes('oversized'));
      const news = result.breakdown.find((b) => b.factor.includes('oversizedNews'));
      expect(Math.abs(tech!.delta)).toBeLessThanOrEqual(ENRICHMENT_SCORE_CAPS.maxSingleT2);
      expect(Math.abs(news!.delta)).toBeLessThanOrEqual(ENRICHMENT_SCORE_CAPS.maxSingleT3);
    });
  });

  describe('FIX_earnings_d0_news (INV-8)', () => {
    it('EVENT wins over bearish news on same dedupeKey — CH_NEWS delta 0', () => {
      const key = 'earnings:2026Q2';
      const breakdown: ScoreBreakdownItem[] = [
        ...baseBreakdown(),
        enrichmentFactor('CH_EVENT', 'earningsD0', 0.15, 'ev.event', {
          dedupeKey: key,
          evidenceParams: { eventDay: 'D0' },
        }),
        enrichmentFactor('CH_NEWS', 'bearishWrap', 0.12, 'ev.news', {
          dedupeKey: key,
          evidenceParams: { tone: 'bearish' },
        }),
      ];
      const score = breakdown.reduce((s, b) => s + b.delta, 0);
      const result = applyEnrichmentDedupe(breakdown, score);

      expect(deltaOf(result.breakdown, 'CH_EVENT')).toBeCloseTo(0.15, 8);
      expect(deltaOf(result.breakdown, 'CH_NEWS')).toBe(0);
      expect(result.breakdown.find((b) => b.factor.startsWith('CH_NEWS'))?.evidenceKey).toBe('ev.news');
    });
  });

  describe('FIX_musk_figure_news (INV-9)', () => {
    it('CH_FIGURE_DIRECT wins — CH_NEWS and CH_NARRATIVE delta 0', () => {
      const key = 'headline:musk-tsla-bull';
      const breakdown: ScoreBreakdownItem[] = [
        enrichmentFactor('CH_FIGURE_DIRECT', 'muskBull', 0.25, 'ev.figure', { dedupeKey: key }),
        enrichmentFactor('CH_NEWS', 'sameHeadline', 0.12, 'ev.news', { dedupeKey: key }),
        enrichmentFactor('CH_NARRATIVE', 'crowdedWrap', 0.1, 'ev.narrative', { dedupeKey: key }),
      ];
      const score = breakdown.reduce((s, b) => s + b.delta, 0);
      const result = applyEnrichmentDedupe(breakdown, score);

      expect(deltaOf(result.breakdown, 'CH_FIGURE_DIRECT')).toBeCloseTo(0.25, 8);
      expect(deltaOf(result.breakdown, 'CH_NEWS')).toBe(0);
      expect(deltaOf(result.breakdown, 'CH_NARRATIVE')).toBe(0);
    });
  });

  describe('FIX_crowded_bullish_chase (INV-7)', () => {
    it('bullish_news_price_down zeroes CH_NEWS momentum delta', () => {
      const breakdown: ScoreBreakdownItem[] = [
        ...baseBreakdown(),
        enrichmentFactor('CH_NEWS', 'bullishChase', 0.12, 'ev.news', {
          evidenceParams: { divergence: 'bullish_news_price_down' },
        }),
      ];
      const score = breakdown.reduce((s, b) => s + b.delta, 0);
      const result = applyEnrichmentDedupe(breakdown, score);

      expect(deltaOf(result.breakdown, 'CH_NEWS')).toBe(0);
      expect(result.score).toBeCloseTo(score - 0.12, 8);
    });
  });

  describe('FIX_trump_macro_only (INV-6, INV-11)', () => {
    it('macro_only linkScope blocks symbol-level figure deltas', () => {
      expect(figureLinkScopeAllowsSymbolDelta('macro_only')).toBe(false);
      expect(figureLinkScopeAllowsSymbolDelta('symbol_direct')).toBe(true);
      expect(figureLinkScopeAllowsSymbolDelta('topic_conditional')).toBe(true);
    });

    it('policyUncertainty does not alter base-only cap pass (INV-11 placeholder)', () => {
      const breakdown = baseBreakdown();
      const score = 1.42;
      const withRegimeFlag = [
        ...breakdown,
        {
          factor: 'policyUncertainty',
          delta: 0,
          evidenceKey: 'shared.market.regime.policyUncertainty',
          evidenceParams: { active: 1 },
        },
      ];
      const result = applyEnrichmentCaps(withRegimeFlag, score);
      expect(result.score).toBeCloseTo(score, 8);
      expect(result.breakdown.filter((b) => b.factor === 'change1d')).toHaveLength(1);
    });
  });

  describe('applyScorePipeline', () => {
    it('runs dedupe then cap and updates evidenceItems', () => {
      const rec = {
        symbol: 'AAPL',
        name: 'Apple',
        market: Market.US,
        currency: 'USD',
        currentPrice: 200,
        changePercent: 1,
        tag: 'momentum' as const,
        tagLabel: '모멘텀',
        reason: '',
        reasonKey: 'shared.market.recommendation.momentumStrong',
        score: 2,
        scoreBreakdown: [
          ...baseBreakdown(),
          enrichmentFactor('CH_TECH', 'breakout', 0.35, 'ev.tech'),
        ],
        evidenceItems: [],
        regimeContext: [],
      };
      const out = applyScorePipeline(rec);
      expect(out.evidenceItems.length).toBeGreaterThan(0);
      expect(out.evidenceItems.length).toBeLessThanOrEqual(3);
    });

    it('CH_TECH keeps delta when EVENT wins same dedupeKey over NEWS', () => {
      const key = 'fact:123';
      const rec = {
        symbol: 'NVDA',
        name: 'NVIDIA',
        market: Market.US,
        currency: 'USD',
        currentPrice: 900,
        changePercent: 2,
        tag: 'momentum' as const,
        tagLabel: '모멘텀',
        reason: '',
        reasonKey: 'k',
        score: 1.5,
        scoreBreakdown: [
          enrichmentFactor('CH_TECH', 'trendUp', 0.2, 'ev.tech', { dedupeKey: key }),
          enrichmentFactor('CH_EVENT', 'beat', 0.15, 'ev.event', { dedupeKey: key }),
          enrichmentFactor('CH_NEWS', 'wrap', 0.1, 'ev.news', { dedupeKey: key }),
        ],
        evidenceItems: [],
        regimeContext: [],
      };
      const out = applyScorePipeline(rec);
      expect(deltaOf(out.scoreBreakdown, 'CH_TECH')).toBeCloseTo(0.2, 8);
      expect(deltaOf(out.scoreBreakdown, 'CH_EVENT')).toBeCloseTo(0.15, 8);
      expect(deltaOf(out.scoreBreakdown, 'CH_NEWS')).toBe(0);
    });
  });
});

function minimalKrContext(): MarketContext {
  return {
    macro: [],
    sectors: [],
    indices: [],
    regimes: [],
    krSentiment: {
      market: Market.KR,
      label: 'bull',
      headline: '',
      description: '',
      headlineKey: 'shared.market.sentiment.bull',
      descriptionKey: 'shared.market.sentiment.bull',
      avgChangePercent: 1,
      upCount: 3,
      downCount: 1,
      flatCount: 0,
    },
    usSentiment: {
      market: Market.US,
      label: 'neutral',
      headline: '',
      description: '',
      headlineKey: 'shared.market.sentiment.neutral',
      descriptionKey: 'shared.market.sentiment.neutral',
      avgChangePercent: 0,
      upCount: 2,
      downCount: 2,
      flatCount: 0,
    },
    leadingKrSectors: [],
    leadingUsSectors: [],
    usdKrwRate: 1300,
    usdKrwChange1d: 0,
    heldSymbols: new Set(),
    watchlistSymbols: new Set(),
    preferredTags: [],
    technicalBySymbol: {},
    newsBySymbol: {},
    eventsBySymbol: {},
    figureStatements: [],
  };
}
