'use client';

import { Suspense } from 'react';
import { ProtectedRoute } from '@/presentation/routes/ProtectedRoute';
import { SettingsPage } from '@/presentation/pages/SettingsPage';

export default function SettingsRoutePage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={null}>
        <SettingsPage />
      </Suspense>
    </ProtectedRoute>
  );
}
