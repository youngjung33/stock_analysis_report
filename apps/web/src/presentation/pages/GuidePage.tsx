'use client';

import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { GuideFaqList } from '../features/guide/GuideFaqList';
import { AppShell } from '../layout';
import { PageStack } from '../design-system';

export function GuidePage() {
  const { t } = useTranslation();

  return (
    <AppShell title={t('pages.guide.title')} subtitle={t('guide.subtitle')}>
      <PageStack>
        <Suspense fallback={null}>
          <GuideFaqList />
        </Suspense>
      </PageStack>
    </AppShell>
  );
}
