import { z } from 'zod';
import { AI_NEWS_TITLE_MAX } from './constants';
import { aiContextEnvelopeSchema } from './envelope';

const marketSchema = z.enum(['KR', 'US']);

const stockDerivedFactsSchema = z.object({
  priceTrendBand: z.enum(['strong_up', 'up', 'flat', 'down', 'strong_down']),
  rsiZone: z.enum(['oversold', 'neutral', 'overbought']).nullable(),
  newsTone: z.enum(['bullish', 'bearish', 'neutral']).nullable(),
  eventHint: z.string().nullable(),
  ruleTag: z.string(),
});

const portfolioDerivedFactsSchema = z.object({
  allocationDrift: z.enum(['balanced', 'kr_heavy', 'us_heavy']),
  topConcentrationPercent: z.number().nullable(),
  cashRatioPercent: z.number(),
  pnlBand: z.enum(['profit', 'loss', 'flat']),
  overweightKrPp: z.number(),
  overweightUsPp: z.number(),
});

const recentEventSchema = z.object({
  kind: z.string(),
  eventDay: z.enum(['D-1', 'D0', 'D+1']),
  source: z.string().optional(),
});

const portfolioReturnSchema = z.object({
  period: z.string(),
  label: z.string(),
  returnPercent: z.number().nullable(),
  coveragePercent: z.number(),
});

const benchmarkComparisonSchema = z.object({
  period: z.string(),
  label: z.string(),
  portfolioReturn: z.number().nullable(),
  benchmarkName: z.string(),
  benchmarkReturn: z.number().nullable(),
  alpha: z.number().nullable(),
});

export const portfolioAiContextSchema = aiContextEnvelopeSchema.extend({
  kind: z.literal('portfolio'),
  facts: z.object({
    summary: z.object({
      totalValueKrw: z.number(),
      totalPnlKrw: z.number(),
      cashKrw: z.number(),
      cashUsd: z.number(),
      holdingCount: z.number().int().nonnegative(),
    }),
    investorProfile: z
      .object({
        compositePercent: z.number().nullable(),
        primaryTypeId: z.string().nullable(),
        tags: z.array(z.string()),
        adjustmentPercent: z.number(),
      })
      .nullable(),
    allocation: z.object({
      targetKrPercent: z.number(),
      targetUsPercent: z.number(),
      actualKrPercent: z.number(),
      actualUsPercent: z.number(),
      maxSingleWeightPercent: z.number(),
      topHoldings: z.array(
        z.object({
          symbol: z.string(),
          market: marketSchema,
          weightPercent: z.number(),
        }),
      ),
    }),
    performance: z.object({
      portfolioReturns: z.array(portfolioReturnSchema),
      benchmarkComparisons: z.array(benchmarkComparisonSchema),
    }),
    simulation: z
      .object({
        actions: z.array(
          z.object({
            symbol: z.string(),
            action: z.string(),
            reason: z.string(),
          }),
        ),
      })
      .nullable(),
    holdingsDigest: z.array(
      z.object({
        symbol: z.string(),
        market: marketSchema,
        name: z.string(),
        rsi14: z.number().nullable(),
        newsTitles: z.array(z.string()).max(AI_NEWS_TITLE_MAX),
        memoSample: z.string().nullable().optional(),
      }),
    ),
    derived: portfolioDerivedFactsSchema,
  }),
});

export const stockAiContextSchema = aiContextEnvelopeSchema.extend({
  kind: z.literal('stock'),
  facts: z.object({
    instrument: z.object({
      symbol: z.string(),
      name: z.string(),
      market: marketSchema,
      currency: z.string(),
    }),
    price: z.object({
      current: z.number(),
      change1d: z.number(),
      change1w: z.number().nullable(),
      change1mo: z.number().nullable(),
    }),
    ruleBasedReport: z.object({
      tag: z.string(),
      tagLabel: z.string(),
      score: z.number().nullable(),
      insights: z.array(
        z.object({
          category: z.string(),
          title: z.string(),
          body: z.string(),
        }),
      ),
      scoreBreakdown: z.array(
        z.object({
          label: z.string(),
          score: z.number(),
          maxScore: z.number(),
        }),
      ),
    }),
    technical: z
      .object({
        rsi14: z.number().nullable(),
        macdSignal: z.string().nullable(),
        trend: z.string().nullable(),
      })
      .nullable(),
    marketLink: z.object({
      regimeIds: z.array(z.string()),
      indexChange1d: z.number().nullable(),
      leadingSectors: z.array(z.string()),
    }),
    userLink: z.object({
      isHeld: z.boolean(),
      isWatchlisted: z.boolean(),
      portfolioWeightPercent: z.number().nullable(),
      unrealizedPnlPercent: z.number().nullable().optional(),
    }),
    recentNewsTitles: z.array(z.string()).max(AI_NEWS_TITLE_MAX),
    recentEvent: recentEventSchema.nullable(),
    derived: stockDerivedFactsSchema,
  }),
});

export const aiContextSchema = z.discriminatedUnion('kind', [
  portfolioAiContextSchema,
  stockAiContextSchema,
]);

export type PortfolioAiContext = z.infer<typeof portfolioAiContextSchema>;
export type StockAiContext = z.infer<typeof stockAiContextSchema>;
export type AiContext = z.infer<typeof aiContextSchema>;
