'use client';

import { useTranslation } from 'react-i18next';
import { ProtectedRoute } from '@/presentation/routes/ProtectedRoute';
import { InvestorTypeSurveyPage } from '@/presentation/pages/InvestorTypeSurveyPage';
import { AppShell } from '@/presentation/layout';
import { PageStack } from '@/presentation/design-system';

export default function InvestorTypeRoutePage() {
  const { t } = useTranslation();

  return (
    <ProtectedRoute>
      <AppShell title={t('pages.investorSurvey.title')} subtitle={t('investorSurvey.subtitle')}>
        <PageStack>
          <InvestorTypeSurveyPage />
        </PageStack>
      </AppShell>
    </ProtectedRoute>
  );
}
