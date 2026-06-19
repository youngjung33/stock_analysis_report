import { useState } from 'react';
import { getErrorMessage } from '@/client/domain/errors/app-error';
import { useAuth } from '../useAuth';
import { useDashboard } from '../useDashboard';

export function useDashboardScreen() {
  const { username, logout } = useAuth();
  const { data, isLoading, error, refresh } = useDashboard();
  const [refreshMessage, setRefreshMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    setRefreshMessage('');
    try {
      const result = await refresh();
      const failMsg =
        result.failed.length > 0
          ? ` (실패 ${result.failed.length}건: ${result.failed.map((f) => f.symbol).join(', ')})`
          : '';
      setRefreshMessage(`${result.updated}개 종목 시세 갱신 완료${failMsg}`);
    } catch (err) {
      setRefreshMessage(getErrorMessage(err, '시세 갱신에 실패했습니다.'));
    } finally {
      setRefreshing(false);
    }
  }

  return {
    username,
    logout,
    data,
    isLoading,
    error,
    refreshMessage,
    refreshing,
    handleRefresh,
  };
}
