'use client';

import { useTranslation } from 'react-i18next';
import { ProtectedRoute } from '@/presentation/routes/ProtectedRoute';
import { TaxGuidePage } from '@/presentation/pages/TaxGuidePage';
import { AppShell } from '@/presentation/layout';
import { PageStack } from '@/presentation/design-system';

export default function TaxRoutePage() {
  const { t } = useTranslation();

  return (
    <ProtectedRoute>
      <AppShell title={t('pages.tax.title')} subtitle={t('tax.guideTitle')}>
        <PageStack>
          <TaxGuidePage />
        </PageStack>
      </AppShell>
    </ProtectedRoute>
  );
}
