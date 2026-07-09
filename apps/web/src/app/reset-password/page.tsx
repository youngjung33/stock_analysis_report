'use client';

import { Suspense } from 'react';
import { ResetPasswordPage } from '@/presentation/pages/ResetPasswordPage';

export default function ResetPasswordRoutePage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordPage />
    </Suspense>
  );
}
