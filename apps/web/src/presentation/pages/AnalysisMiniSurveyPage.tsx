'use client';

import { notFound } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { isMiniAnalysisTestId, type MiniAnalysisTestId } from '@sar/shared';
import { ProtectedRoute } from '@/presentation/routes/ProtectedRoute';
import { AppShell } from '@/presentation/layout';
import { PageStack } from '@/presentation/design-system';
import { AnalysisMiniSurveyFlow } from '@/presentation/features/investor-survey/AnalysisMiniSurveyFlow';

interface Props {
  testId: string;
}

export function AnalysisMiniSurveyPage({ testId }: Props) {
  const { t } = useTranslation();

  if (!isMiniAnalysisTestId(testId)) {
    notFound();
  }

  const id = testId as MiniAnalysisTestId;

  return (
    <ProtectedRoute>
      <AppShell
        title={t(`investorSurvey.miniTests.${id}.title`)}
        subtitle={t(`investorSurvey.miniTests.${id}.subtitle`)}
      >
        <PageStack>
          <AnalysisMiniSurveyFlow testId={id} />
        </PageStack>
      </AppShell>
    </ProtectedRoute>
  );
}
