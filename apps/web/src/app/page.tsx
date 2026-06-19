'use client';

import { ProtectedRoute } from '@/presentation/routes/ProtectedRoute';
import { DashboardPage } from '@/presentation/pages/DashboardPage';

export default function HomePage() {
  return (
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  );
}
