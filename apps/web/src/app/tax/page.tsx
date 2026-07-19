'use client';

import { ProtectedRoute } from '@/presentation/routes/ProtectedRoute';
import { TaxGuidePage } from '@/presentation/pages/TaxGuidePage';
import { AppShell } from '@/presentation/layout';
import { PageStack } from '@/presentation/design-system';

export default function TaxRoutePage() {
  return (
    <ProtectedRoute>
      <AppShell title="세금 정보" subtitle="한국 거주자 주식 투자 세금 기준 전체">
        <PageStack>
          <TaxGuidePage />
        </PageStack>
      </AppShell>
    </ProtectedRoute>
  );
}
