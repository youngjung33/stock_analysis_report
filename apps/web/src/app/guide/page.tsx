'use client';

import { ProtectedRoute } from '@/presentation/routes/ProtectedRoute';
import { GuidePage } from '@/presentation/pages/GuidePage';

export default function GuideRoutePage() {
  return (
    <ProtectedRoute>
      <GuidePage />
    </ProtectedRoute>
  );
}
