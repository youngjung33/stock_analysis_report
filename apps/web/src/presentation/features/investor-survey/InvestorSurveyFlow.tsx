'use client';

import { useTranslation } from 'react-i18next';
import { Surface } from '../../design-system';
import { useInvestorSurvey } from '../../hooks/useInvestorSurvey';
import { InvestorSurveyResultView } from './InvestorSurveyResultView';
import { InvestorSurveyStepView } from './InvestorSurveyStepView';

export function InvestorSurveyFlow() {
  const { t } = useTranslation();
  const survey = useInvestorSurvey();

  if (survey.phase === 'result' && survey.result) {
    return <InvestorSurveyResultView result={survey.result} answers={survey.answers} onRetake={survey.retake} />;
  }

  if (survey.phase === 'intro') {
    return (
      <div className="space-y-6">
        <Surface variant="section" className="space-y-4 border-primary/25 bg-primary/5">
          <div>
            <h2 className="text-lg font-semibold md:text-xl">{t('investorSurvey.title')}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t('investorSurvey.intro')}</p>
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
