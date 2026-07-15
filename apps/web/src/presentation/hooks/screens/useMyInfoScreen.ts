'use client';

import { useState } from 'react';
import { useAuth } from '../useAuth';
import { useDashboard } from '../useDashboard';

export function useMyInfoScreen() {
  const { username, isGuest } = useAuth();
  const { data, isLoading, reload } = useDashboard();
  const [refreshKey, setRefreshKey] = useState(0);

  function onPortfolioUpdated() {
    void reload();
    setRefreshKey((k) => k + 1);
  }

  return {
    displayName: isGuest ? '비회원' : username,
    isGuest,
    data,
    isLoading,
    refreshKey,
    onPortfolioUpdated,
  };
}
