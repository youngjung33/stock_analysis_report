'use client';

import { ProtectedRoute } from '@/presentation/routes/ProtectedRoute';
import { TaxGuidePage } from '@/presentation/pages/TaxGuidePage';

export default function TaxRoutePage() {
  return (
    <ProtectedRoute>
      <TaxGuidePage />
    </ProtectedRoute>
  );
}
