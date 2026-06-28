'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Market } from '@sar/shared';
import { apiClient } from '@/client/data/api/client';
import { WatchlistItem } from '@/client/domain/models';
import { guestSession } from '@/client/data/guest/guest-session';
import { getGuestWatchlist, removeGuestWatchlistItem, saveGuestWatchlistItem } from '@/client/data/guest/guest-storage';

async function fetchWatchlist(): Promise<WatchlistItem[]> {
  if (guestSession.isActive()) return getGuestWatchlist();
  const { data } = await apiClient.get<{ items: WatchlistItem[] }>('/watchlist');
  return data.items;
}

export function useWatchlist(holdingSymbols: { symbol: string; market: Market }[] = []) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['watchlist'],
    queryFn: fetchWatchlist,
  });

  const addMutation = useMutation({
    mutationFn: async (input: { symbol: string; name: string; market: Market }) => {
      if (guestSession.isActive()) {
        return saveGuestWatchlistItem(input);
      }
      const { data } = await apiClient.post<{ item: WatchlistItem }>('/watchlist', input);
      return data.item;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watchlist'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (guestSession.isActive()) {
        removeGuestWatchlistItem(id);
        return;
      }
      await apiClient.delete(`/watchlist/${id}`);
    },
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
