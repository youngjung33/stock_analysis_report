'use client';

import { useTranslation } from 'react-i18next';
import { ProtectedRoute } from '@/presentation/routes/ProtectedRoute';
import { GuidePage } from '@/presentation/pages/GuidePage';
import { AppShell } from '@/presentation/layout';
import { PageStack } from '@/presentation/design-system';

export default function GuideRoutePage() {
  const { t } = useTranslation();

  return (
    <ProtectedRoute>
      <AppShell title={t('pages.guide.title')} subtitle={t('guide.subtitle')}>
        <PageStack>
          <GuidePage />
        </PageStack>
      </AppShell>
    </ProtectedRoute>
  );
}
