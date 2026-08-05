import {
  MINI_ANALYSIS_TEST_IDS,
  computeInvestorSurveyResult,
  computeMiniAnalysisResult,
  createDefaultStoredProfile,
  scoreEntryFromInvestorSurvey,
  scoreEntryFromMiniTest,
  upsertTestScore,
  type InvestorScoreLedger,
  type InvestorSurveyAnswers,
  type MiniAnalysisTestId,
  type StoredInvestorProfile,
} from '@sar/shared';

const INVESTOR_SURVEY_KEY = 'sar_investor_survey';

function readInvestorSurveyAnswers(): InvestorSurveyAnswers {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(INVESTOR_SURVEY_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as { answers?: InvestorSurveyAnswers };
    return parsed.answers ?? {};
  } catch {
    return {};
  }
}

function readMiniSurveyAnswers(testId: MiniAnalysisTestId): InvestorSurveyAnswers {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(`sar_mini_analysis_${testId}`);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as { answers?: InvestorSurveyAnswers };
    return parsed.answers ?? {};
  } catch {
    return {};
  }
}

export function hydrateLedgerFromLocalAnswers(ledger: InvestorScoreLedger): InvestorScoreLedger {
  let next = ledger;

  const fullAnswers = readInvestorSurveyAnswers();
  if (computeInvestorSurveyResult(fullAnswers) && !next.entries['investor-type']) {
    const entry = scoreEntryFromInvestorSurvey(fullAnswers);
    if (entry) next = upsertTestScore(next, entry);
  }

  for (const testId of MINI_ANALYSIS_TEST_IDS) {
    const answers = readMiniSurveyAnswers(testId);
    if (computeMiniAnalysisResult(testId, answers) && !next.entries[testId]) {
      const entry = scoreEntryFromMiniTest(testId, answers);
      if (entry) next = upsertTestScore(next, entry);
    }
  }

  return next;
}

export function normalizeStoredProfile(raw: StoredInvestorProfile | null | undefined): StoredInvestorProfile {
  if (!raw?.ledger) return createDefaultStoredProfile();
  return {
    ledger: raw.ledger,
    adjustmentPercent: raw.adjustmentPercent ?? 100,
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  };
}

export function hydrateStoredProfile(
  stored: StoredInvestorProfile,
  options?: { fromLocalAnswers?: boolean },
): StoredInvestorProfile {
  if (options?.fromLocalAnswers === false) return stored;

  const hydratedLedger = hydrateLedgerFromLocalAnswers(stored.ledger);
  const changed = JSON.stringify(hydratedLedger.entries) !== JSON.stringify(stored.ledger.entries);
  if (!changed) return stored;
  return {
    ...stored,
    ledger: hydratedLedger,
    updatedAt: new Date().toISOString(),
  };
}
