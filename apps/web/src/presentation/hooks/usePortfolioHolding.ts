'use client';

import { Market } from '@sar/shared';
import { useQuery } from '@tanstack/react-query';
import { useServices } from './useServices';

import { QUERY_STALE } from '../lib/query-config';

export function usePortfolioHolding(symbol: string, market: Market) {
  const { getHoldingBySymbolUseCase } = useServices();

  return useQuery({
    queryKey: ['portfolio', 'holding', symbol, market],
    queryFn: () => getHoldingBySymbolUseCase.execute(symbol, market),
    staleTime: QUERY_STALE.dashboard,
  });
}
