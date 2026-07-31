'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  INVESTOR_SURVEY_OPTION_IDS,
  MINI_ANALYSIS_TESTS,
  computeMiniAnalysisResult,
  type InvestorSurveyAnswers,
  type InvestorSurveyOptionId,
  type InvestorSurveyStepId,
  type MiniAnalysisTestId,
} from '@sar/shared';

function storageKey(testId: MiniAnalysisTestId) {
  return `sar_mini_analysis_${testId}`;
}

function readStored(testId: MiniAnalysisTestId): InvestorSurveyAnswers {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(storageKey(testId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as { answers?: InvestorSurveyAnswers };
    return parsed.answers ?? {};
  } catch {
    return {};
  }
}

function writeStored(testId: MiniAnalysisTestId, answers: InvestorSurveyAnswers) {
  localStorage.setItem(storageKey(testId), JSON.stringify({ answers }));
}

export function useMiniAnalysisSurvey(testId: MiniAnalysisTestId) {
  const def = MINI_ANALYSIS_TESTS[testId];
  const stepIds = def.stepIds;
  const stepCount = stepIds.length;

  const [answers, setAnswers] = useState<InvestorSurveyAnswers>(() => readStored(testId));
  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState<'intro' | 'survey' | 'result'>(() => {
    return computeMiniAnalysisResult(testId, readStored(testId)) ? 'result' : 'intro';
  });

  useEffect(() => {
    const stored = readStored(testId);
    setAnswers(stored);
    if (computeMiniAnalysisResult(testId, stored)) setPhase('result');
  }, [testId]);

  const currentStepId: InvestorSurveyStepId = stepIds[stepIndex]!;
  const currentAnswer = answers[currentStepId];
  const result = useMemo(() => computeMiniAnalysisResult(testId, answers), [testId, answers]);

  const setAnswer = useCallback(
    (stepId: InvestorSurveyStepId, optionId: InvestorSurveyOptionId) => {
      setAnswers((prev) => {
        const next = { ...prev, [stepId]: optionId };
        writeStored(testId, next);
        return next;
      });
    },
    [testId],
  );

  const goNext = useCallback(() => {
    if (stepIndex < stepCount - 1) {
      setStepIndex((i) => i + 1);
      return;
    }
    if (computeMiniAnalysisResult(testId, answers)) setPhase('result');
  }, [answers, stepCount, stepIndex, testId]);

  const goPrev = useCallback(() => {
    if (stepIndex > 0) setStepIndex((i) => i - 1);
  }, [stepIndex]);

  const startSurvey = useCallback(() => {
    setStepIndex(0);
    setPhase('survey');
  }, []);

  const retake = useCallback(() => {
    const empty: InvestorSurveyAnswers = {};
    setAnswers(empty);
    setStepIndex(0);
    setPhase('intro');
    writeStored(testId, empty);
  }, [testId]);

  return {
    phase,
    stepIndex,
    stepCount,
    currentStepId,
    currentAnswer,
    answers,
    result,
    optionIds: INVESTOR_SURVEY_OPTION_IDS,
    setAnswer,
    goNext,
    goPrev,
    startSurvey,
    retake,
    canGoNext: Boolean(currentAnswer),
    isFirstStep: stepIndex === 0,
    isLastStep: stepIndex === stepCount - 1,
  };
}
