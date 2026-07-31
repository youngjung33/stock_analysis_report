'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  INVESTOR_SURVEY_OPTION_IDS,
  INVESTOR_SURVEY_STEP_COUNT,
  INVESTOR_SURVEY_STEP_IDS,
  computeInvestorSurveyResult,
  type InvestorSurveyAnswers,
  type InvestorSurveyOptionId,
  type InvestorSurveyStepId,
  type InvestorTypeId,
} from '@sar/shared';

const STORAGE_KEY = 'sar_investor_survey';

export interface StoredInvestorSurvey {
  answers: InvestorSurveyAnswers;
  completedAt?: string;
  typeId?: InvestorTypeId;
}

function readStored(): StoredInvestorSurvey {
  if (typeof localStorage === 'undefined') return { answers: {} };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { answers: {} };
    const parsed = JSON.parse(raw) as StoredInvestorSurvey;
    return { answers: parsed.answers ?? {}, completedAt: parsed.completedAt, typeId: parsed.typeId };
  } catch {
    return { answers: {} };
  }
}

function writeStored(data: StoredInvestorSurvey) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function useInvestorSurvey() {
  const [answers, setAnswers] = useState<InvestorSurveyAnswers>(() => readStored().answers);
  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState<'intro' | 'survey' | 'result'>(() => {
    const stored = readStored();
    const result = computeInvestorSurveyResult(stored.answers);
    return result ? 'result' : 'intro';
  });

  useEffect(() => {
    const stored = readStored();
    setAnswers(stored.answers);
    if (computeInvestorSurveyResult(stored.answers)) setPhase('result');
  }, []);

  const currentStepId: InvestorSurveyStepId = INVESTOR_SURVEY_STEP_IDS[stepIndex]!;
  const currentAnswer = answers[currentStepId];

  const result = useMemo(() => computeInvestorSurveyResult(answers), [answers]);

  const setAnswer = useCallback(
    (stepId: InvestorSurveyStepId, optionId: InvestorSurveyOptionId) => {
      setAnswers((prev) => {
        const next = { ...prev, [stepId]: optionId };
        writeStored({ answers: next });
        return next;
      });
    },
    [],
  );

  const goNext = useCallback(() => {
    if (stepIndex < INVESTOR_SURVEY_STEP_COUNT - 1) {
      setStepIndex((i) => i + 1);
      return;
    }
    const finalAnswers = { ...answers };
    const computed = computeInvestorSurveyResult(finalAnswers);
    if (computed) {
      writeStored({
        answers: finalAnswers,
        completedAt: new Date().toISOString(),
        typeId: computed.typeId,
      });
      setPhase('result');
    }
  }, [answers, stepIndex]);

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
    writeStored({ answers: empty });
  }, []);

  const canGoNext = Boolean(currentAnswer);

  return {
    phase,
    stepIndex,
    stepCount: INVESTOR_SURVEY_STEP_COUNT,
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
    canGoNext,
    isFirstStep: stepIndex === 0,
    isLastStep: stepIndex === INVESTOR_SURVEY_STEP_COUNT - 1,
  };
}
