'use client';

import { Suspense } from 'react';
import { GuideFaqList } from '../features/guide/GuideFaqList';

export function GuidePage() {
  return (
    <Suspense fallback={null}>
      <GuideFaqList />
    </Suspense>
  );
}
