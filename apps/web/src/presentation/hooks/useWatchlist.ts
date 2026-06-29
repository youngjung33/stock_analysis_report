'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Market } from '@sar/shared';
import { useServices } from './useServices';

export function useWatchlist(holdingSymbols: { symbol: string; market: Market }[] = []) {
  const { listWatchlistUseCase, addWatchlistUseCase, removeWatchlistUseCase } = useServices();
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

  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    add: addMutation.mutateAsync,
    remove: deleteMutation.mutateAsync,
    isHeld: (symbol: string, market: Market) => holdingSet.has(`${symbol}:${market}`),
  };
}
