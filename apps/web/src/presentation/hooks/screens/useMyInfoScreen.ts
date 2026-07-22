'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../useAuth';
import { useDashboard } from '../useDashboard';

export function useMyInfoScreen() {
  const { t } = useTranslation();
  const { username, isGuest } = useAuth();
  const { data, isLoading, reload } = useDashboard();
  const [refreshKey, setRefreshKey] = useState(0);

  function onPortfolioUpdated() {
    void reload();
    setRefreshKey((k) => k + 1);
  }

  return {
    displayName: isGuest ? t('guest.displayName') : username,
    isGuest,
    data,
    isLoading,
    refreshKey,
    onPortfolioUpdated,
  };
}
