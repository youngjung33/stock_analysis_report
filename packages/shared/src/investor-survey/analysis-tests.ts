import type { InvestorSurveyStepId } from '../investor-survey/catalog';
import { scoreSurveyOption, type InvestorSurveyAnswers, type InvestorSurveyOptionId } from '../investor-survey/catalog';

export const MINI_ANALYSIS_TEST_IDS = ['risk-check', 'horizon-goal', 'allocation-style'] as const;
export type MiniAnalysisTestId = (typeof MINI_ANALYSIS_TEST_IDS)[number];

export type AnalysisTestId = 'investor-type' | MiniAnalysisTestId;

export interface AnalysisTestLinkDef {
  id: AnalysisTestId;
  href: string;
  guideItemId: string;
  stepCount: number;
}

/** Tip 「나의 유형분석」 카테고리 — 테스트 목록 (guide catalog item id ↔ route) */
export const GUIDE_ANALYSIS_TEST_LINKS: AnalysisTestLinkDef[] = [
  {
    id: 'investor-type',
    href: '/guide/investor-type',
    guideItemId: 'analysis-investor-type',
    stepCount: 10,
  },
  {
    id: 'risk-check',
    href: '/guide/analysis/risk-check',
    guideItemId: 'analysis-risk-check',
    stepCount: 5,
  },
  {
    id: 'horizon-goal',
    href: '/guide/analysis/horizon-goal',
    guideItemId: 'analysis-horizon-goal',
    stepCount: 5,
  },
  {
    id: 'allocation-style',
    href: '/guide/analysis/allocation-style',
    guideItemId: 'analysis-allocation-style',
    stepCount: 5,
  },
];

export interface MiniAnalysisTestDef {
  id: MiniAnalysisTestId;
  stepIds: InvestorSurveyStepId[];
  tierCount: number;
}

export const MINI_ANALYSIS_TESTS: Record<MiniAnalysisTestId, MiniAnalysisTestDef> = {
  'risk-check': {
    id: 'risk-check',
    stepIds: ['loss-tolerance', 'crisis-reaction', 'return-expectation', 'emergency-fund', 'diversification'],
    tierCount: 5,
  },
  'horizon-goal': {
    id: 'horizon-goal',
    stepIds: ['horizon', 'purpose', 'experience', 'income-stability', 'knowledge'],
    tierCount: 5,
  },
  'allocation-style': {
    id: 'allocation-style',
    stepIds: ['diversification', 'return-expectation', 'loss-tolerance', 'purpose', 'horizon'],
    tierCount: 5,
  },
};

export interface MiniAnalysisResult {
  testId: MiniAnalysisTestId;
  totalScore: number;
  maxScore: number;
  tierIndex: number;
  tierId: string;
  answeredCount: number;
}

export function isMiniAnalysisTestId(value: string): value is MiniAnalysisTestId {
  return (MINI_ANALYSIS_TEST_IDS as readonly string[]).includes(value);
}

export function isAnalysisTestId(value: string): value is AnalysisTestId {
  return value === 'investor-type' || isMiniAnalysisTestId(value);
}

export function getAnalysisTestLink(id: AnalysisTestId): AnalysisTestLinkDef | undefined {
  return GUIDE_ANALYSIS_TEST_LINKS.find((t) => t.id === id);
}

export function computeMiniAnalysisResult(
  testId: MiniAnalysisTestId,
  answers: InvestorSurveyAnswers,
): MiniAnalysisResult | null {
  const def = MINI_ANALYSIS_TESTS[testId];
  const answeredCount = def.stepIds.filter((stepId) => answers[stepId]).length;
  if (answeredCount < def.stepIds.length) return null;

  let totalScore = 0;
  for (const stepId of def.stepIds) {
    totalScore += scoreSurveyOption(answers[stepId] as InvestorSurveyOptionId);
  }

  const minScore = def.stepIds.length;
  const maxScore = def.stepIds.length * 4;
  const clamped = Math.max(minScore, Math.min(maxScore, totalScore));
  const tierIndex = Math.min(def.tierCount - 1, Math.floor((clamped - minScore) / 3));

  return {
    testId,
    totalScore,
    maxScore,
    tierIndex,
    tierId: `tier-${tierIndex + 1}`,
    answeredCount,
  };
}
