import type { RecommendationTag, StockRecommendation } from '../market-insights';
import type { PortfolioPreferences } from '../portfolio-simulation';
import type { AnalysisTestId } from './analysis-tests';
import {
  INVESTOR_SURVEY_STEP_COUNT,
  computeInvestorSurveyResult,
  getInvestorTypeProfile,
  resolveInvestorTypeFromScore,
  type InvestorSurveyAnswers,
  type InvestorTypeId,
} from './catalog';
import { MINI_ANALYSIS_TESTS, computeMiniAnalysisResult, type MiniAnalysisTestId } from './analysis-tests';

export const TEST_SCORE_WEIGHTS: Record<AnalysisTestId, number> = {
  'investor-type': 40,
  'risk-check': 20,
  'horizon-goal': 20,
  'allocation-style': 20,
};

export const DEFAULT_ADJUSTMENT_PERCENT = 100;
export const MIN_ADJUSTMENT_PERCENT = 70;
export const MAX_ADJUSTMENT_PERCENT = 130;

export const ANALYSIS_TEST_IDS: AnalysisTestId[] = [
  'investor-type',
  'risk-check',
  'horizon-goal',
  'allocation-style',
];

export interface TestScoreEntry {
  testId: AnalysisTestId;
  rawScore: number;
  minScore: number;
  maxScore: number;
  percentScore: number;
  completedAt: string;
}

export interface InvestorScoreLedger {
  entries: Partial<Record<AnalysisTestId, TestScoreEntry>>;
}

/** Persisted profile — derived fields are computed on read. */
export interface StoredInvestorProfile {
  ledger: InvestorScoreLedger;
  adjustmentPercent: number;
  updatedAt: string;
}

export interface BuiltInvestorProfile extends StoredInvestorProfile {
  compositePercent: number | null;
  effectivePercent: number;
  typeId: InvestorTypeId;
  level: number;
  preferredTags: RecommendationTag[];
  preferences: PortfolioPreferences;
  completedTestCount: number;
}

export function createEmptyLedger(): InvestorScoreLedger {
  return { entries: {} };
}

export function createDefaultStoredProfile(now = new Date().toISOString()): StoredInvestorProfile {
  return {
    ledger: createEmptyLedger(),
    adjustmentPercent: DEFAULT_ADJUSTMENT_PERCENT,
    updatedAt: now,
  };
}

export function normalizePercentScore(rawScore: number, minScore: number, maxScore: number): number {
  if (maxScore <= minScore) return 0;
  const clamped = Math.max(minScore, Math.min(maxScore, rawScore));
  return ((clamped - minScore) / (maxScore - minScore)) * 100;
}

export function upsertTestScore(
  ledger: InvestorScoreLedger,
  entry: Omit<TestScoreEntry, 'percentScore'> & { percentScore?: number },
): InvestorScoreLedger {
  const percentScore =
    entry.percentScore ?? normalizePercentScore(entry.rawScore, entry.minScore, entry.maxScore);
  return {
    entries: {
      ...ledger.entries,
      [entry.testId]: { ...entry, percentScore },
    },
  };
}

export function computeCompositePercent(ledger: InvestorScoreLedger): number | null {
  const done = ANALYSIS_TEST_IDS.map((id) => ledger.entries[id]).filter(
    (e): e is TestScoreEntry => Boolean(e),
  );
  if (done.length === 0) return null;

  let weighted = 0;
  let totalW = 0;
  for (const entry of done) {
    const w = TEST_SCORE_WEIGHTS[entry.testId];
    weighted += entry.percentScore * w;
    totalW += w;
  }
  return totalW > 0 ? weighted / totalW : null;
}

export function clampAdjustmentPercent(value: number): number {
  return Math.max(MIN_ADJUSTMENT_PERCENT, Math.min(MAX_ADJUSTMENT_PERCENT, value));
}

export function effectivePercentFromComposite(
  compositePercent: number | null,
  adjustmentPercent: number,
): number {
  if (compositePercent === null) return 50;
  return (compositePercent * clampAdjustmentPercent(adjustmentPercent)) / 100;
}

export function totalScoreFromEffectivePercent(effectivePercent: number): number {
  return 10 + (effectivePercent / 100) * 30;
}

export function buildInvestorProfile(stored: StoredInvestorProfile): BuiltInvestorProfile {
  const compositePercent = computeCompositePercent(stored.ledger);
  const adjustmentPercent = clampAdjustmentPercent(stored.adjustmentPercent);
  const completedTestCount = ANALYSIS_TEST_IDS.filter((id) => stored.ledger.entries[id]).length;

  if (compositePercent === null) {
    const typeProfile = getDefaultTypeProfile();
    return {
      ...stored,
      adjustmentPercent,
      compositePercent: null,
      effectivePercent: 50,
      typeId: typeProfile.id,
      level: typeProfile.level,
      preferredTags: typeProfile.preferredTags,
      preferences: { ...typeProfile.preferences },
      completedTestCount,
    };
  }

  const effectivePercent = effectivePercentFromComposite(compositePercent, adjustmentPercent);
  const totalScore = totalScoreFromEffectivePercent(effectivePercent);
  const typeProfile = resolveInvestorTypeFromScore(totalScore);

  return {
    ...stored,
    adjustmentPercent,
    compositePercent,
    effectivePercent,
    typeId: typeProfile.id,
    level: typeProfile.level,
    preferredTags: typeProfile.preferredTags,
    preferences: { ...typeProfile.preferences },
    completedTestCount,
  };
}

export function scoreEntryFromInvestorSurvey(
  answers: InvestorSurveyAnswers,
  completedAt = new Date().toISOString(),
): TestScoreEntry | null {
  const result = computeInvestorSurveyResult(answers);
  if (!result) return null;
  const minScore = INVESTOR_SURVEY_STEP_COUNT;
  return {
    testId: 'investor-type',
    rawScore: result.totalScore,
    minScore,
    maxScore: result.maxScore,
    percentScore: normalizePercentScore(result.totalScore, minScore, result.maxScore),
    completedAt,
  };
}

export function scoreEntryFromMiniTest(
  testId: MiniAnalysisTestId,
  answers: InvestorSurveyAnswers,
  completedAt = new Date().toISOString(),
): TestScoreEntry | null {
  const result = computeMiniAnalysisResult(testId, answers);
  if (!result) return null;
  const minScore = MINI_ANALYSIS_TESTS[testId].stepIds.length;
  return {
    testId,
    rawScore: result.totalScore,
    minScore,
    maxScore: result.maxScore,
    percentScore: normalizePercentScore(result.totalScore, minScore, result.maxScore),
    completedAt,
  };
}

export function rankRecommendationsByTags(
  recommendations: StockRecommendation[],
  preferredTags: RecommendationTag[],
): StockRecommendation[] {
  if (!preferredTags.length || !recommendations.length) return recommendations;

  const matched = recommendations.filter((r) => preferredTags.includes(r.tag));
  if (matched.length === 0) return recommendations;

  const rest = recommendations.filter((r) => !preferredTags.includes(r.tag));
  return [...matched, ...rest];
}

export function getDefaultTypeProfile() {
  return getInvestorTypeProfile('balanced')!;
}
