'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '@/client/domain/errors/app-error';
import { useToast } from '../../components/Toast';
import { useServices } from '../useServices';
import { invalidatePortfolioLocal, MARKET_QUERY_KEYS, QUERY_STALE } from '../../lib/query-config';

export function useCorporateActionList(refreshKey: number) {
  const { listCorporateActionsUseCase, deleteCorporateActionUseCase } = useServices();
  const queryClient = useQueryClient();
  const { showError, showSuccess } = useToast();
  const { data, isLoading, refetch } = useQuery({
    queryKey: [...MARKET_QUERY_KEYS.corporateActions, refreshKey],
    queryFn: () => listCorporateActionsUseCase.execute(),
    staleTime: QUERY_STALE.corporateActions,
  });

  async function handleDelete(id: string) {
    if (!confirm('이 내역을 삭제할까요?')) return;

    try {
      await deleteCorporateActionUseCase.execute(id);
      showSuccess('내역이 삭제되었습니다.');
      await invalidatePortfolioLocal(queryClient);
      refetch();
    } catch (err) {
      showError(getErrorMessage(err, '삭제에 실패했습니다.'));
    }
  }

  return { data, isLoading, handleDelete };
}
