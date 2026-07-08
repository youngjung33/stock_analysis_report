'use client';

import { useQuery } from '@tanstack/react-query';
import { getErrorMessage } from '@/client/domain/errors/app-error';
import { useToast } from '../../components/Toast';
import { useServices } from '../useServices';

export function useTransactionList(refreshKey: number) {
  const { listTransactionsUseCase, deleteTransactionUseCase } = useServices();
  const { showError, showSuccess } = useToast();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['transactions', refreshKey],
    queryFn: () => listTransactionsUseCase.execute(),
  });

  async function handleDelete(id: string) {
    if (!confirm('이 거래를 삭제할까요?')) return;

    try {
      await deleteTransactionUseCase.execute(id);
      showSuccess('거래가 삭제되었습니다.');
      refetch();
    } catch (err) {
      showError(getErrorMessage(err, '거래 삭제에 실패했습니다.'));
    }
  }

  return { data, isLoading, handleDelete };
}
