import type { PortfolioPreferences } from '../portfolio-simulation';
import type { RecommendationTag } from '../market-insights';

export const INVESTOR_SURVEY_STEP_COUNT = 10;

export const INVESTOR_SURVEY_STEP_IDS = [
  'horizon',
  'loss-tolerance',
  'experience',
  'income-stability',
  'emergency-fund',
  'knowledge',
  'crisis-reaction',
  'return-expectation',
  'diversification',
  'purpose',
] as const;

export type InvestorSurveyStepId = (typeof INVESTOR_SURVEY_STEP_IDS)[number];

export const INVESTOR_SURVEY_OPTION_IDS = ['a', 'b', 'c', 'd'] as const;
export type InvestorSurveyOptionId = (typeof INVESTOR_SURVEY_OPTION_IDS)[number];

/** Per-option score: conservative (a=1) → aggressive (d=4) */
export const INVESTOR_SURVEY_OPTION_SCORES: Record<InvestorSurveyOptionId, number> = {
  a: 1,
  b: 2,
  c: 3,
  d: 4,
};

export const INVESTOR_TYPE_IDS = [
  'ultra-safe',
  'safe',
  'conservative',
  'mod-conservative',
  'balanced',
  'mod-growth',
  'growth',
  'agg-growth',
  'aggressive',
  'ultra-aggressive',
] as const;

export type InvestorTypeId = (typeof INVESTOR_TYPE_IDS)[number];

export interface InvestorAssetMix {
  stocks: number;
  etf: number;
  bonds: number;
  cash: number;
}

export interface InvestorTypeProfile {
  id: InvestorTypeId;
  level: number;
  preferences: PortfolioPreferences;
  assetMix: InvestorAssetMix;
  preferredTags: RecommendationTag[];
  horizonYearsMin: number;
  horizonYearsMax: number;
}

export const INVESTOR_TYPE_PROFILES: InvestorTypeProfile[] = [
  {
    id: 'ultra-safe',
    level: 1,
    preferences: { targetKrPercent: 90, targetUsPercent: 10, maxSingleWeightPercent: 15 },
    assetMix: { stocks: 10, etf: 10, bonds: 30, cash: 50 },
    preferredTags: ['defensive'],
    horizonYearsMin: 0,
    horizonYearsMax: 1,
  },
  {
    id: 'safe',
    level: 2,
    preferences: { targetKrPercent: 85, targetUsPercent: 15, maxSingleWeightPercent: 20 },
    assetMix: { stocks: 15, etf: 15, bonds: 35, cash: 35 },
    preferredTags: ['defensive'],
    horizonYearsMin: 1,
    horizonYearsMax: 3,
  },
  {
    id: 'conservative',
    level: 3,
    preferences: { targetKrPercent: 80, targetUsPercent: 20, maxSingleWeightPercent: 25 },
    assetMix: { stocks: 25, etf: 20, bonds: 30, cash: 25 },
    preferredTags: ['defensive', 'watchlist'],
    horizonYearsMin: 3,
    horizonYearsMax: 5,
  },
  {
    id: 'mod-conservative',
    level: 4,
    preferences: { targetKrPercent: 75, targetUsPercent: 25, maxSingleWeightPercent: 30 },
    assetMix: { stocks: 35, etf: 25, bonds: 25, cash: 15 },
    preferredTags: ['defensive', 'watchlist'],
    horizonYearsMin: 5,
    horizonYearsMax: 7,
  },
  {
    id: 'balanced',
    level: 5,
    preferences: { targetKrPercent: 70, targetUsPercent: 30, maxSingleWeightPercent: 35 },
    assetMix: { stocks: 45, etf: 25, bonds: 20, cash: 10 },
    preferredTags: ['watchlist', 'pullback'],
    horizonYearsMin: 5,
    horizonYearsMax: 10,
  },
  {
    id: 'mod-growth',
    level: 6,
    preferences: { targetKrPercent: 65, targetUsPercent: 35, maxSingleWeightPercent: 40 },
    assetMix: { stocks: 55, etf: 25, bonds: 12, cash: 8 },
    preferredTags: ['watchlist', 'pullback', 'momentum'],
    horizonYearsMin: 7,
    horizonYearsMax: 12,
  },
  {
    id: 'growth',
    level: 7,
    preferences: { targetKrPercent: 60, targetUsPercent: 40, maxSingleWeightPercent: 45 },
    assetMix: { stocks: 65, etf: 20, bonds: 10, cash: 5 },
    preferredTags: ['momentum', 'pullback'],
    horizonYearsMin: 10,
    horizonYearsMax: 15,
  },
  {
    id: 'agg-growth',
    level: 8,
    preferences: { targetKrPercent: 55, targetUsPercent: 45, maxSingleWeightPercent: 50 },
    assetMix: { stocks: 75, etf: 15, bonds: 5, cash: 5 },
    preferredTags: ['momentum'],
    horizonYearsMin: 10,
    horizonYearsMax: 20,
  },
  {
    id: 'aggressive',
    level: 9,
    preferences: { targetKrPercent: 50, targetUsPercent: 50, maxSingleWeightPercent: 55 },
    assetMix: { stocks: 85, etf: 10, bonds: 3, cash: 2 },
    preferredTags: ['momentum'],
    horizonYearsMin: 15,
    horizonYearsMax: 25,
  },
  {
    id: 'ultra-aggressive',
    level: 10,
    preferences: { targetKrPercent: 45, targetUsPercent: 55, maxSingleWeightPercent: 60 },
    assetMix: { stocks: 90, etf: 8, bonds: 1, cash: 1 },
    preferredTags: ['momentum'],
    horizonYearsMin: 20,
    horizonYearsMax: 30,
  },
];

export type InvestorSurveyAnswers = Partial<Record<InvestorSurveyStepId, InvestorSurveyOptionId>>;

export interface InvestorSurveyResult {
  totalScore: number;
  maxScore: number;
  typeId: InvestorTypeId;
  typeLevel: number;
  profile: InvestorTypeProfile;
  answeredCount: number;
}

export function isInvestorSurveyStepId(value: string): value is InvestorSurveyStepId {
  return (INVESTOR_SURVEY_STEP_IDS as readonly string[]).includes(value);
}

export function isInvestorTypeId(value: string): value is InvestorTypeId {
  return (INVESTOR_TYPE_IDS as readonly string[]).includes(value);
}

export function scoreSurveyOption(optionId: InvestorSurveyOptionId): number {
  return INVESTOR_SURVEY_OPTION_SCORES[optionId];
}

export function computeSurveyTotalScore(answers: InvestorSurveyAnswers): number {
  let total = 0;
  for (const stepId of INVESTOR_SURVEY_STEP_IDS) {
    const option = answers[stepId];
    if (option) total += scoreSurveyOption(option);
  }
  return total;
}

export function resolveInvestorTypeFromScore(totalScore: number): InvestorTypeProfile {
  const minScore = INVESTOR_SURVEY_STEP_COUNT;
  const clamped = Math.max(minScore, Math.min(INVESTOR_SURVEY_STEP_COUNT * 4, totalScore));
  const index = Math.min(
    INVESTOR_TYPE_PROFILES.length - 1,
    Math.floor((clamped - minScore) / 3),
  );
  return INVESTOR_TYPE_PROFILES[index]!;
}

export function computeInvestorSurveyResult(answers: InvestorSurveyAnswers): InvestorSurveyResult | null {
  const answeredCount = INVESTOR_SURVEY_STEP_IDS.filter((id) => answers[id]).length;
  if (answeredCount < INVESTOR_SURVEY_STEP_COUNT) return null;

  const totalScore = computeSurveyTotalScore(answers);
  const profile = resolveInvestorTypeFromScore(totalScore);

  return {
    totalScore,
    maxScore: INVESTOR_SURVEY_STEP_COUNT * 4,
    typeId: profile.id,
    typeLevel: profile.level,
    profile,
    answeredCount,
  };
}

export function getInvestorTypeProfile(typeId: InvestorTypeId): InvestorTypeProfile | undefined {
  return INVESTOR_TYPE_PROFILES.find((p) => p.id === typeId);
}
