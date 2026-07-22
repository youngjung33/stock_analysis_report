'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { getErrorMessage } from '@/client/domain/errors/app-error';
import { buildQuoteRefreshNotice, QuoteRefreshNotice } from '@/client/domain/services/quote-notice';
import { useToast } from '../../components/Toast';
import { useAuth } from '../useAuth';
import { useDashboard } from '../useDashboard';
import { useMarketStatus } from '../useMarketStatus';

export function useDashboardScreen() {
  const { t } = useTranslation();
  const { username, isGuest, logout } = useAuth();
  const { data, isLoading, error, reload, refresh } = useDashboard();
  const marketStatus = useMarketStatus();
  const { showError, showSuccess } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [refreshNotice, setRefreshNotice] = useState<QuoteRefreshNotice | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (searchParams.get('welcome') !== '1') return;
    showSuccess(t('common.welcomeRegistered'));
    router.replace('/', { scroll: false });
  }, [searchParams, showSuccess, router, t]);

  useEffect(() => {
    if (!error) return;
    showError(t('errors.dashboardLoadFailed'));
  }, [error, showError, t]);

  async function handleRefresh() {
    setRefreshing(true);
    setRefreshNotice(null);
    try {
      const result = await refresh();
      const notice = buildQuoteRefreshNotice(result, t);
      if (!notice) return;

      if (notice.variant === 'error') {
        showError(notice.lines[0] ?? t('errors.quoteRefreshFailed'));
        return;
      }

      setRefreshNotice(notice);
    } catch (err) {
      showError(getErrorMessage(err, t('errors.quoteRefreshFailed')));
    } finally {
      setRefreshing(false);
    }
  }

  return {
    username,
    displayName: isGuest ? t('guest.displayName') : username,
    isGuest,
    logout,
    data,
    isLoading,
    marketProviders: marketStatus.data ?? [],
    marketStatusLoading: marketStatus.isLoading,
    refreshNotice,
    refreshing,
    handleRefresh,
    refreshDashboard: reload,
  };
}
