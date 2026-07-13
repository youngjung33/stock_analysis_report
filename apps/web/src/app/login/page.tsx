'use client';

import { Suspense } from 'react';
import { LoginPage } from '@/presentation/pages/LoginPage';

export default function LoginRoutePage() {
  return (
    <Suspense fallback={null}>
      <LoginPage />
    </Suspense>
  );
}
