'use client';

import { ProtectedRoute } from '@/presentation/routes/ProtectedRoute';
import { DashboardView } from '@/presentation/views/DashboardView';

export default function HomePage() {
  return (
    <ProtectedRoute>
      <DashboardView />
    </ProtectedRoute>
  );
}
