import { useQuery } from '@tanstack/react-query';
import { useServices } from '../useServices';

export function useTransactionList(refreshKey: number) {
  const { listTransactionsUseCase, deleteTransactionUseCase } = useServices();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['transactions', refreshKey],
    queryFn: () => listTransactionsUseCase.execute(),
  });

  async function handleDelete(id: string) {
    if (!confirm('이 거래를 삭제할까요?')) return;
    await deleteTransactionUseCase.execute(id);
    refetch();
  }

  return { data, isLoading, handleDelete };
}
