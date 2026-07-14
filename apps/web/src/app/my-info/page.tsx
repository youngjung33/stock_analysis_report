'use client';

import { ProtectedRoute } from '@/presentation/routes/ProtectedRoute';
import { MyInfoPage } from '@/presentation/pages/MyInfoPage';

export default function MyInfoRoutePage() {
  return (
    <ProtectedRoute>
      <MyInfoPage />
    </ProtectedRoute>
  );
}
