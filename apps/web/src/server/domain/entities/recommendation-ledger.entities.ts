import { Market } from '@sar/shared';
import type { RecommendationOutcomeHorizon } from '@sar/shared';

export interface RecommendationOutcomeEntity {
  id: string;
  itemId: string;
  horizon: RecommendationOutcomeHorizon;
  evaluatedAt: Date;
  priceAtHorizon: number;
  returnPercent: number;
  benchmarkReturn: number | null;
  alphaVsBenchmark: number | null;
}

export interface RecommendationItemEntity {
  id: string;
  batchId: string;
  rank: number;
  symbol: string;
  market: Market;
  tag: string;
  score: number;
  priceAtRun: number;
  changePercent1d: number | null;
  evidence: unknown;
  outcomes?: RecommendationOutcomeEntity[];
}

export interface RecommendationBatchEntity {
  id: string;
  runAt: Date;
  tradingDate: string;
  engineVersion: string;
  profileKey: string;
  regimes: unknown;
  macroSnapshot: unknown | null;
  candidatePool: unknown | null;
  createdAt: Date;
  items?: RecommendationItemEntity[];
}

export interface CreateRecommendationBatchInput {
  runAt: Date;
  tradingDate: string;
  engineVersion: string;
  profileKey: string;
  regimes: unknown;
  macroSnapshot: unknown | null;
  candidatePool: unknown | null;
  items: Array<{
    rank: number;
    symbol: string;
    market: Market;
    tag: string;
    score: number;
    priceAtRun: number;
    changePercent1d: number | null;
    evidence: unknown;
  }>;
}

export interface UpsertRecommendationOutcomeInput {
  itemId: string;
  horizon: RecommendationOutcomeHorizon;
  evaluatedAt: Date;
  priceAtHorizon: number;
  returnPercent: number;
  benchmarkReturn: number | null;
  alphaVsBenchmark: number | null;
}
