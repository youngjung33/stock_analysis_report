'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { InvestorSurveyAnswers, MiniAnalysisResult, MiniAnalysisTestId } from '@sar/shared';
import { scoreEntryFromMiniTest } from '@sar/shared';
import { useToast } from '../../components/Toast';
import { Surface } from '../../design-system';
import { useInvestorProfile } from '../../hooks/useInvestorProfile';
import { useMiniAnalysisSurvey } from '../../hooks/useMiniAnalysisSurvey';
import { InvestorSurveyStepView } from '../investor-survey/InvestorSurveyStepView';

interface Props {
  testId: MiniAnalysisTestId;
}

function MiniResultView({
  testId,
  result,
  answers,
  sessionCompleted,
  onRetake,
}: {
  testId: MiniAnalysisTestId;
  result: MiniAnalysisResult;
  answers: InvestorSurveyAnswers;
  sessionCompleted: boolean;
  onRetake: () => void;
}) {
  const { t } = useTranslation();
  const { showSuccess } = useToast();
  const { profile, upsertTestScoreEntry, stored } = useInvestorProfile();
  const appliedRef = useRef(false);
  const base = `investorSurvey.miniTests.${testId}.results.${result.tierId}`;
  const tips = t(`${base}.tips`, { returnObjects: true, defaultValue: [] }) as string[];

  useEffect(() => {
    if (!sessionCompleted || appliedRef.current) return;
    const entry = scoreEntryFromMiniTest(testId, answers);
    if (!entry) return;
    appliedRef.current = true;
    const hadBefore = Boolean(stored.ledger.entries[testId]);
    void upsertTestScoreEntry(entry).then(() => {
      showSuccess(t(hadBefore ? 'investorSurvey.ledgerUpdated' : 'investorSurvey.ledgerAccumulated'));
    });
  }, [answers, sessionCompleted, showSuccess, stored.ledger.entries, t, testId, upsertTestScoreEntry]);

  return (
    <div className="space-y-6">
      <Surface variant="section" className="space-y-4 border-primary/20 bg-primary/5">
        <p className="text-xs text-muted-foreground">{t(`investorSurvey.miniTests.${testId}.resultTitle`)}</p>
        <h2 className="text-xl font-bold">{t(`${base}.name`)}</h2>
        <p className="text-sm tabular-nums text-muted-foreground">
          {t('investorSurvey.scoreOf', { score: result.totalScore, max: result.maxScore })}
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">{t(`${base}.summary`)}</p>
        {profile.compositePercent !== null && (
          <p className="text-xs text-primary">
            {t('investorSurvey.profilePreview', {
              composite: profile.compositePercent.toFixed(1),
              effective: profile.effectivePercent.toFixed(1),
            })}
          </p>
        )}
      </Surface>

      {Array.isArray(tips) && tips.length > 0 && (
        <Surface variant="section" className="space-y-2">
          <h3 className="text-sm font-semibold">{t('investorSurvey.strategyTitle')}</h3>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            {tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </Surface>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Link
          href="/my-info#investor-profile"
          className="rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground"
        >
          {t('investorSurvey.goProfile')}
        </Link>
        <Link
          href="/guide/investor-type"
          className="rounded-lg border border-border px-4 py-2.5 text-center text-sm text-muted-foreground hover:bg-muted/50"
        >
          {t('investorSurvey.ctaLink')}
        </Link>
        <button
          type="button"
          onClick={onRetake}
          className="rounded-lg border border-border px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted/50"
        >
          {t('investorSurvey.retake')}
        </button>
        <Link
          href="/guide?category=type-analysis"
          className="rounded-lg border border-border px-4 py-2.5 text-center text-sm text-muted-foreground hover:bg-muted/50"
        >
          {t('investorSurvey.backToGuide')}
        </Link>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">{t('investorSurvey.disclaimer')}</p>
    </div>
  );
}

export function AnalysisMiniSurveyFlow({ testId }: Props) {
  const { t } = useTranslation();
  const survey = useMiniAnalysisSurvey(testId);
  const testBase = `investorSurvey.miniTests.${testId}`;

  if (survey.phase === 'result' && survey.result) {
    return (
      <MiniResultView
        testId={testId}
        result={survey.result}
        answers={survey.answers}
        sessionCompleted={survey.sessionCompleted}
        onRetake={survey.retake}
      />
    );
  }

  if (survey.phase === 'intro') {
    return (
      <div className="space-y-6">
        <Surface variant="section" className="space-y-4 border-primary/25 bg-primary/5">
          <div>
            <h2 className="text-lg font-semibold md:text-xl">{t(`${testBase}.title`)}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t(`${testBase}.subtitle`)}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(`${testBase}.intro`)}</p>
          </div>
          <button
            type="button"
            onClick={survey.startSurvey}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
          >
            {t('investorSurvey.start')}
          </button>
        </Surface>
        <p className="text-xs leading-relaxed text-muted-foreground">{t('investorSurvey.disclaimer')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <InvestorSurveyStepView
        stepId={survey.currentStepId}
        stepIndex={survey.stepIndex}
        stepCount={survey.stepCount}
        selected={survey.currentAnswer}
        onSelect={(optionId) => survey.setAnswer(survey.currentStepId, optionId)}
      />
      <div className="flex gap-2">
        {!survey.isFirstStep && (
          <button
            type="button"
            onClick={survey.goPrev}
            className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted/50"
          >
            {t('investorSurvey.prev')}
          </button>
        )}
        <button
          type="button"
          disabled={!survey.canGoNext}
          onClick={survey.goNext}
          className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {survey.isLastStep ? t('investorSurvey.seeResult') : t('investorSurvey.next')}
        </button>
      </div>
    </div>
  );
}
