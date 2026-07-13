'use client';

import { Suspense } from 'react';
import { ProtectedRoute } from '@/presentation/routes/ProtectedRoute';
import { DashboardPage } from '@/presentation/pages/DashboardPage';

export default function HomePage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={null}>
        <DashboardPage />
      </Suspense>
    </ProtectedRoute>
  );
}
