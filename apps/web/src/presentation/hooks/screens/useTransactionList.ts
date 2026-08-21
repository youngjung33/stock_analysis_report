'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Transaction } from '@/client/domain/models';
import { getErrorMessage } from '@/client/domain/errors/app-error';
import { useToast } from '../../components/Toast';
import { useServices } from '../useServices';
import { invalidatePortfolioLocal, MARKET_QUERY_KEYS, QUERY_STALE } from '../../lib/query-config';

export function useTransactionList(refreshKey: number) {
  const { t } = useTranslation();
  const { listTransactionsUseCase, deleteTransactionUseCase } = useServices();
  const queryClient = useQueryClient();
  const { showError, showSuccess } = useToast();
  const [editing, setEditing] = useState<Transaction | null>(null);
  const { data, isLoading, refetch } = useQuery({
    queryKey: [...MARKET_QUERY_KEYS.transactions, refreshKey],
    queryFn: () => listTransactionsUseCase.execute(),
    staleTime: QUERY_STALE.transactions,
  });

  async function handleDelete(id: string) {
    if (!confirm(t('transactions.confirm.delete'))) return;

    try {
      await deleteTransactionUseCase.execute(id);
      showSuccess(t('transactions.toast.deleted'));
      await invalidatePortfolioLocal(queryClient);
      refetch();
    } catch (err) {
      showError(getErrorMessage(err, t('transactions.toast.deleteFailed')));
    }
  }

  function handleEdit(tx: Transaction) {
    setEditing(tx);
  }

  function handleEditClose() {
    setEditing(null);
  }

  async function handleEditSuccess() {
    await invalidatePortfolioLocal(queryClient);
    refetch();
  }

  return {
    data,
    isLoading,
    handleDelete,
    editing,
    handleEdit,
    handleEditClose,
    handleEditSuccess,
  };
}
