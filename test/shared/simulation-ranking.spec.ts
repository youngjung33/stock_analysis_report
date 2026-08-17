import { describe, expect, it } from 'vitest';
import { Market } from '@sar/shared';
import {
  extractNarrativeDivergence,
  resolveSimulationAddPriority,
  resolveSimulationDeployCapRatio,
  sortRecommendationsForSimulationAdd,
} from '@sar/shared';
import type { StockRecommendation } from '@sar/shared';

function rec(partial: Partial<StockRecommendation> & Pick<StockRecommendation, 'symbol'>): StockRecommendation {
  return {
    name: partial.symbol,
    market: Market.US,
    currency: 'USD',
    currentPrice: 100,
    changePercent: 0,
    tag: 'watchlist',
    tagLabel: '관찰',
    reason: 'test',
    ...partial,
  };
}

describe('simulation-ranking (Phase K)', () => {
  describe('resolveSimulationAddPriority', () => {
    it('boosts buyback / dividend signals', () => {
      const result = resolveSimulationAddPriority(
        rec({
          symbol: 'AAPL',
          scoreBreakdown: [
            { factor: 'CH_EVENT:buyback', delta: 0.1, evidenceKey: 'ev', evidenceParams: {} },
          ],
        }),
      );
      expect(result.priority).toBe('boosted');
      expect(result.reasonKey).toBe('shared.simulation.addPriority.buyback');
    });

    it('deprioritizes narrative divergence', () => {
      const result = resolveSimulationAddPriority(
        rec({
          symbol: 'NVDA',
          scoreBreakdown: [
            {
              factor: 'CH_NARRATIVE',
              delta: -0.15,
              evidenceKey: 'ev',
              evidenceParams: { divergence: 'bullish_news_price_down' },
            },
          ],
        }),
      );
      expect(result.priority).toBe('deprioritized');
      expect(result.reasonKey).toBe('shared.simulation.addPriority.narrativeDivergence');
    });

    it('deprioritizes earnings D0/D+1', () => {
      const result = resolveSimulationAddPriority(
        rec({
          symbol: 'MSFT',
          scoreBreakdown: [
            {
              factor: 'CH_EVENT:earnings',
              delta: 0.1,
              evidenceKey: 'ev',
              evidenceParams: { eventDay: 'D0', kind: 'earnings_us' },
            },
          ],
        }),
      );
      expect(result.priority).toBe('deprioritized');
      expect(result.reasonKey).toBe('shared.simulation.addPriority.earningsEvent');
    });

    it('deprioritizes volatile direct figure hits', () => {
      const result = resolveSimulationAddPriority(
        rec({
          symbol: 'TSLA',
          scoreBreakdown: [
            {
              factor: 'CH_FIGURE_DIRECT:musk',
              delta: 0.25,
              evidenceKey: 'ev',
              evidenceParams: { figure: 'musk' },
            },
          ],
        }),
      );
      expect(result.priority).toBe('deprioritized');
      expect(result.reasonKey).toBe('shared.simulation.addPriority.figureVolatile');
    });

    it('returns normal when no enrichment signals', () => {
      expect(resolveSimulationAddPriority(rec({ symbol: 'X' })).priority).toBe('normal');
    });
  });

  describe('sortRecommendationsForSimulationAdd', () => {
    it('orders boosted before normal before deprioritized, then by score', () => {
      const sorted = sortRecommendationsForSimulationAdd([
        rec({
          symbol: 'LOW',
          score: 1,
          scoreBreakdown: [
            {
              factor: 'CH_NARRATIVE',
              delta: -0.1,
              evidenceKey: 'ev',
              evidenceParams: { divergence: 'crowded_bullish_chase' },
            },
          ],
        }),
        rec({ symbol: 'MID', score: 5 }),
        rec({
          symbol: 'BOOST',
          score: 2,
          scoreBreakdown: [
            { factor: 'CH_EVENT:dividend', delta: 0.1, evidenceKey: 'ev', evidenceParams: {} },
          ],
        }),
      ]);
      expect(sorted.map((r) => r.symbol)).toEqual(['BOOST', 'MID', 'LOW']);
    });
  });

  describe('resolveSimulationDeployCapRatio', () => {
    it('caps at 15% under globalRiskOff', () => {
      expect(
        resolveSimulationDeployCapRatio({
          regimes: ['globalRiskOff'],
          baseRatio: 0.6,
        }),
      ).toBe(0.15);
    });

    it('caps at 10% under policy uncertainty', () => {
      expect(
        resolveSimulationDeployCapRatio({
          policyUncertainty: true,
          baseRatio: 0.6,
        }),
      ).toBe(0.1);
    });

    it('applies the stricter cap when both apply', () => {
      expect(
        resolveSimulationDeployCapRatio({
          regimes: ['globalRiskOff'],
          policyUncertainty: true,
          baseRatio: 0.6,
        }),
      ).toBe(0.1);
    });
  });

  describe('extractNarrativeDivergence', () => {
    it('returns divergence kind when present', () => {
      expect(
        extractNarrativeDivergence(
          rec({
            symbol: 'A',
            scoreBreakdown: [
              {
                factor: 'CH_NARRATIVE',
                delta: -0.1,
                evidenceKey: 'ev',
                evidenceParams: { divergence: 'bearish_news_price_up' },
              },
            ],
          }),
        ),
      ).toBe('bearish_news_price_up');
    });

    it('returns null for aligned / none', () => {
      expect(
        extractNarrativeDivergence(
          rec({
            symbol: 'A',
            scoreBreakdown: [
              {
                factor: 'CH_NARRATIVE',
                delta: 0,
                evidenceKey: 'ev',
                evidenceParams: { divergence: 'aligned' },
              },
            ],
          }),
        ),
      ).toBeNull();
    });
  });
});
