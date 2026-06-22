import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '@/client/domain/errors/app-error';
import { buildQuoteRefreshNotice, QuoteRefreshNotice } from '@/client/domain/services/quote-notice';
import { useAuth } from '../useAuth';
import { useDashboard } from '../useDashboard';
import { useFeaturedQuotes } from '../useFeaturedQuotes';
import { useMarketStatus } from '../useMarketStatus';

export function useDashboardScreen() {
  const { username, isGuest, logout } = useAuth();
  const { data, isLoading, error, refresh } = useDashboard();
  const marketStatus = useMarketStatus();
  const featuredQuotes = useFeaturedQuotes();
  const queryClient = useQueryClient();
  const [refreshNotice, setRefreshNotice] = useState<QuoteRefreshNotice | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    setRefreshNotice(null);
    try {
      const result = await refresh();
      setRefreshNotice(buildQuoteRefreshNotice(result));
      await queryClient.invalidateQueries({ queryKey: ['featured-quotes'] });
    } catch (err) {
      setRefreshNotice({
        variant: 'error',
        lines: [getErrorMessage(err, '시세 갱신에 실패했습니다.')],
      });
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
    error,
    marketProviders: marketStatus.data ?? [],
    marketStatusLoading: marketStatus.isLoading,
    featuredQuotes: featuredQuotes.data,
    featuredQuotesLoading: featuredQuotes.isLoading,
    refreshNotice,
    refreshing,
    handleRefresh,
  };
}