'use client';

import { Suspense } from 'react';
import { ProtectedRoute } from '@/presentation/routes/ProtectedRoute';
import { DashboardView } from '@/presentation/views/DashboardView';

export default function HomePage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={null}>
        <DashboardView />
      </Suspense>
    </ProtectedRoute>
  );
}
