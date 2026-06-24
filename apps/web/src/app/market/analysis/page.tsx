'use client';

import { ProtectedRoute } from '@/presentation/routes/ProtectedRoute';
import { MarketAnalysisView } from '@/presentation/views/MarketAnalysisView';

export default function MarketAnalysisRoutePage() {
  return (
    <ProtectedRoute>
      <MarketAnalysisView />
    </ProtectedRoute>
  );
}
