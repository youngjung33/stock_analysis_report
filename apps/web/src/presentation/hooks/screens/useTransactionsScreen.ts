import { useState } from 'react';
import { useAuth } from '../useAuth';

export function useTransactionsScreen() {
  const { logout } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  function onTransactionCreated() {
    setRefreshKey((k) => k + 1);
  }

  return { logout, refreshKey, onTransactionCreated };
}
