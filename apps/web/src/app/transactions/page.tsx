'use client';

import { ProtectedRoute } from '@/presentation/routes/ProtectedRoute';
import { TransactionsView } from '@/presentation/views/TransactionsView';

export default function TransactionsRoutePage() {
  return (
    <ProtectedRoute>
      <TransactionsView />
    </ProtectedRoute>
  );
}
