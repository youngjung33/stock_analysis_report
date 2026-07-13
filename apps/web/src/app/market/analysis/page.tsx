'use client';

import { ProtectedRoute } from '@/presentation/routes/ProtectedRoute';
import { MarketAnalysisPage } from '@/presentation/pages/MarketAnalysisPage';

export default function MarketAnalysisRoutePage() {
  return (
    <ProtectedRoute>
      <MarketAnalysisPage />
    </ProtectedRoute>
  );
}
