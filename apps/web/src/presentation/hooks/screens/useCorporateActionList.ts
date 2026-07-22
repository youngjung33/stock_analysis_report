'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getErrorMessage } from '@/client/domain/errors/app-error';
import { useToast } from '../../components/Toast';
import { useServices } from '../useServices';
import { invalidatePortfolioLocal, MARKET_QUERY_KEYS, QUERY_STALE } from '../../lib/query-config';

export function useCorporateActionList(refreshKey: number) {
  const { t } = useTranslation();
  const { listCorporateActionsUseCase, deleteCorporateActionUseCase } = useServices();
  const queryClient = useQueryClient();
  const { showError, showSuccess } = useToast();
  const { data, isLoading, refetch } = useQuery({
    queryKey: [...MARKET_QUERY_KEYS.corporateActions, refreshKey],
    queryFn: () => listCorporateActionsUseCase.execute(),
    staleTime: QUERY_STALE.corporateActions,
  });

  async function handleDelete(id: string) {
    if (!confirm(t('corporateAction.confirm.delete'))) return;

    try {
      await deleteCorporateActionUseCase.execute(id);
      showSuccess(t('corporateAction.toast.deleted'));
      await invalidatePortfolioLocal(queryClient);
      refetch();
    } catch (err) {
      showError(getErrorMessage(err, t('corporateAction.toast.deleteFailed')));
    }
  }

  return { data, isLoading, handleDelete };
}
