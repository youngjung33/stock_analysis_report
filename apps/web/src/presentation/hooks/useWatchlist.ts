'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Market } from '@sar/shared';
import { getErrorMessage } from '@/client/domain/errors/app-error';
import { useToast } from '../components/Toast';
import { useServices } from './useServices';

export function useWatchlist(holdingSymbols: { symbol: string; market: Market }[] = []) {
  const { t } = useTranslation();
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
      showSuccess(t('watchlist.toast.addSuccess'));
    } catch (err) {
      showError(getErrorMessage(err, t('watchlist.toast.addFailed')));
    }
  }

  async function remove(id: string) {
    try {
      await deleteMutation.mutateAsync(id);
      showSuccess(t('watchlist.toast.removeSuccess'));
    } catch (err) {
      showError(getErrorMessage(err, t('watchlist.toast.removeFailed')));
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
