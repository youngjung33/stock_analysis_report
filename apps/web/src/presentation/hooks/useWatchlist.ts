'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Market } from '@sar/shared';
import { getErrorMessage } from '@/client/domain/errors/app-error';
import { useToast } from '../components/Toast';
import { useServices } from './useServices';

export function useWatchlist(holdingSymbols: { symbol: string; market: Market }[] = []) {
  const { listWatchlistUseCase, addWatchlistUseCase, removeWatchlistUseCase } = useServices();
  const { showError, showSuccess } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['watchlist'],
    queryFn: () => listWatchlistUseCase.execute(),
  });

  const addMutation = useMutation({
    mutationFn: (input: { symbol: string; name: string; market: Market }) =>
      addWatchlistUseCase.execute(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watchlist'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeWatchlistUseCase.execute(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watchlist'] }),
  });

  const holdingSet = new Set(holdingSymbols.map((h) => `${h.symbol}:${h.market}`));

  async function add(input: { symbol: string; name: string; market: Market }) {
    try {
      await addMutation.mutateAsync(input);
      showSuccess('관심종목에 추가했습니다.');
    } catch (err) {
      showError(getErrorMessage(err, '관심종목 추가에 실패했습니다.'));
    }
  }

  async function remove(id: string) {
    try {
      await deleteMutation.mutateAsync(id);
      showSuccess('관심종목에서 삭제했습니다.');
    } catch (err) {
      showError(getErrorMessage(err, '관심종목 삭제에 실패했습니다.'));
    }
  }

  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    add,
    remove,
    isHeld: (symbol: string, market: Market) => holdingSet.has(`${symbol}:${market}`),
  };
}
