import { useQuery } from '@tanstack/react-query';
import { StockSearchResult } from '@sar/shared';
import { useServices } from './useServices';
import { MARKET_QUERY_KEYS, QUERY_STALE } from '../lib/query-config';

export function useStockAnalysis(selected: StockSearchResult | null) {
  const { getStockAnalysisUseCase } = useServices();

  return useQuery({
    queryKey: [...MARKET_QUERY_KEYS.stockAnalysisRoot, selected?.symbol, selected?.market],
    queryFn: () =>
      getStockAnalysisUseCase.execute({
        symbol: selected!.symbol,
        name: selected!.name,
        market: selected!.market,
        yahooSymbol: selected!.yahooSymbol,
      }),
    enabled: selected !== null,
    staleTime: QUERY_STALE.marketReport,
  });
}
