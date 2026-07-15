'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '@/client/domain/errors/app-error';
import { useToast } from '../../components/Toast';
import { useServices } from '../useServices';
import { invalidatePortfolioLocal, MARKET_QUERY_KEYS, QUERY_STALE } from '../../lib/query-config';

export function useTransactionList(refreshKey: number) {
  const { listTransactionsUseCase, deleteTransactionUseCase } = useServices();
  const queryClient = useQueryClient();
  const { showError, showSuccess } = useToast();
  const { data, isLoading, refetch } = useQuery({
    queryKey: [...MARKET_QUERY_KEYS.transactions, refreshKey],
    queryFn: () => listTransactionsUseCase.execute(),
    staleTime: QUERY_STALE.transactions,
  });

  async function handleDelete(id: string) {
    if (!confirm('이 거래를 삭제할까요?')) return;

    try {
      await deleteTransactionUseCase.execute(id);
      showSuccess('거래가 삭제되었습니다.');
      await invalidatePortfolioLocal(queryClient);
      refetch();
    } catch (err) {
      showError(getErrorMessage(err, '거래 삭제에 실패했습니다.'));
    }
  }

  return { data, isLoading, handleDelete };
}
