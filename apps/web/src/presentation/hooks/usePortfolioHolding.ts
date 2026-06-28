'use client';

import { Market } from '@sar/shared';
import { useQuery } from '@tanstack/react-query';
import { useServices } from './useServices';

export function usePortfolioHolding(symbol: string, market: Market) {
  const { getHoldingBySymbolUseCase } = useServices();

  return useQuery({
    queryKey: ['portfolio', 'holding', symbol, market],
    queryFn: () => getHoldingBySymbolUseCase.execute(symbol, market),
    staleTime: 30_000,
  });
}
