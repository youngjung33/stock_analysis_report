import { describe, expect, it } from 'vitest';
import {
  AI_SCHEMA_VERSION,
  aiContextSchema,
  aiInsightEnvelopeSchema,
  dedicatedAnalyzeRequestSchema,
  portfolioAiContextSchema,
  stockAiContextSchema,
} from '@sar/shared';

const baseEnvelope = {
  schemaVersion: AI_SCHEMA_VERSION,
  locale: 'ko' as const,
  generatedAt: new Date().toISOString(),
  contextHash: 'abc123hash',
  constraints: { maxSections: 5, tone: 'educational' as const, noTradeAdvice: true as const },
};

describe('AI schemas', () => {
  it('validates stock context fixture', () => {
    const parsed = stockAiContextSchema.parse({
      ...baseEnvelope,
      kind: 'stock',
      facts: {
        instrument: { symbol: '005930', name: 'Samsung', market: 'KR', currency: 'KRW' },
        price: { current: 70000, change1d: 1.2, change1w: -0.5, change1mo: 3.1 },
        ruleBasedReport: {
          tag: 'hold',
          tagLabel: '관망',
          score: 0.4,
          insights: [{ category: 'stockStory', title: 't', body: 'b' }],
          scoreBreakdown: [{ label: 'momentum', score: 1, maxScore: 2 }],
        },
        technical: { rsi14: 55, macdSignal: 'neutral', trend: 'sideways' },
        marketLink: { regimeIds: ['risk_on'], indexChange1d: 0.3, leadingSectors: ['Tech'] },
        userLink: { isHeld: true, isWatchlisted: false, portfolioWeightPercent: 12.5 },
        recentNews: [{ title: 'News', source: 'RSS', ageHours: 2 }],
      },
    });
    expect(parsed.kind).toBe('stock');
    expect(aiContextSchema.parse(parsed)).toBeTruthy();
  });

  it('validates portfolio context fixture', () => {
    const parsed = portfolioAiContextSchema.parse({
      ...baseEnvelope,
      kind: 'portfolio',
      facts: {
        summary: {
          totalValueKrw: 10000000,
          totalPnlKrw: 500000,
          cashKrw: 1000000,
          cashUsd: 0,
          holdingCount: 3,
        },
        investorProfile: {
          compositePercent: 62,
          primaryTypeId: 'balanced',
          tags: ['growth'],
          adjustmentPercent: 100,
        },
        allocation: {
          targetKrPercent: 60,
          targetUsPercent: 40,
          actualKrPercent: 70,
          actualUsPercent: 30,
          maxSingleWeightPercent: 25,
          topHoldings: [{ symbol: '005930', market: 'KR', weightPercent: 20 }],
        },
        performance: {
          portfolioReturns: [
            { period: '1m', label: '1M', returnPercent: 2.1, coveragePercent: 100 },
          ],
          benchmarkComparisons: [
            {
              period: '1m',
              label: '1M',
              portfolioReturn: 2.1,
              benchmarkName: 'KOSPI',
              benchmarkReturn: 1.5,
              alpha: 0.6,
            },
          ],
        },
        simulation: { actions: [{ symbol: '005930', action: 'trim', reason: 'overweight' }] },
        holdingsDigest: [
          {
            symbol: '005930',
            market: 'KR',
            name: 'Samsung',
            rsi14: 60,
            newsHeadlines: ['Headline'],
          },
        ],
      },
    });
    expect(parsed.kind).toBe('portfolio');
  });

  it('validates insight envelope', () => {
    const parsed = aiInsightEnvelopeSchema.parse({
      schemaVersion: AI_SCHEMA_VERSION,
      kind: 'stock',
      locale: 'ko',
      disclaimer: '참고용',
      meta: {
        providerId: 'gemini',
        model: 'gemini-2.0-flash',
        promptVersion: 'stock-v1',
        latencyMs: 1200,
      },
      sections: [{ id: 'stock.summary', title: '요약', body: '본문' }],
    });
    expect(parsed.sections).toHaveLength(1);
  });

  it('validates dedicated analyze request shape', () => {
    const context = stockAiContextSchema.parse({
      ...baseEnvelope,
      kind: 'stock',
      facts: {
        instrument: { symbol: 'AAPL', name: 'Apple', market: 'US', currency: 'USD' },
        price: { current: 200, change1d: 0.5, change1w: null, change1mo: null },
        ruleBasedReport: {
          tag: 'hold',
          tagLabel: 'Hold',
          score: null,
          insights: [],
          scoreBreakdown: [],
        },
        technical: null,
        marketLink: { regimeIds: [], indexChange1d: null, leadingSectors: [] },
        userLink: { isHeld: false, isWatchlisted: true, portfolioWeightPercent: null },
        recentNews: [],
      },
    });
    dedicatedAnalyzeRequestSchema.parse({
      context,
      outputSchema: { type: 'object' },
      locale: 'en',
    });
  });
});
