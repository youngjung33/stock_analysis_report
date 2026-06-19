'use client';

import { ProtectedRoute } from '@/presentation/routes/ProtectedRoute';
import { TransactionsPage } from '@/presentation/pages/TransactionsPage';

export default function TransactionsRoutePage() {
  return (
    <ProtectedRoute>
      <TransactionsPage />
    </ProtectedRoute>
  );
}
