import { describe, expect, it } from 'vitest';
import { Market } from '@sar/shared';
import {
  applyEnrichmentCaps,
  applyScorePipeline,
  enrichmentFactor,
  ENRICHMENT_SCORE_CAPS,
  scoreKrCandidate,
  scoreUsCandidate,
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

describe('score-pipeline (G0 / appendix D)', () => {
  describe('FIX_v1_parity (INV-10)', () => {
    it('applyEnrichmentCaps leaves base-only breakdown unchanged', () => {
      const breakdown = baseBreakdown();
      const score = 1.42;
      const result = applyEnrichmentCaps(breakdown, score);
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
      const result = applyEnrichmentCaps(breakdown, score);

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

  describe('applyScorePipeline', () => {
    it('updates evidenceItems from top factors after cap', () => {
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
  };
}
