'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getErrorMessage } from '@/client/domain/errors/app-error';
import { buildQuoteRefreshNotice, QuoteRefreshNotice } from '@/client/domain/services/quote-notice';
import { useToast } from '../../components/Toast';
import { useAuth } from '../useAuth';
import { useDashboard } from '../useDashboard';
import { useMarketStatus } from '../useMarketStatus';

export function useDashboardScreen() {
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
    showSuccess('회원가입을 환영합니다! 포트폴리오를 시작해 보세요.');
    router.replace('/', { scroll: false });
  }, [searchParams, showSuccess, router]);

  useEffect(() => {
    if (!error) return;
    showError('대시보드를 불러오지 못했습니다.');
  }, [error, showError]);

  async function handleRefresh() {
    setRefreshing(true);
    setRefreshNotice(null);
    try {
      const result = await refresh();
      const notice = buildQuoteRefreshNotice(result);
      if (!notice) return;

      if (notice.variant === 'error') {
        showError(notice.lines[0] ?? '시세 갱신에 실패했습니다.');
        return;
      }

      setRefreshNotice(notice);
    } catch (err) {
      showError(getErrorMessage(err, '시세 갱신에 실패했습니다.'));
    } finally {
      setRefreshing(false);
    }
  }

  return {
    username,
    displayName: isGuest ? '비회원' : username,
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
