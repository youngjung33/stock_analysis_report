import { useQuery } from '@tanstack/react-query';
import { Market, QuoteChartRange } from '@sar/shared';
import { useServices } from './useServices';
import { QUERY_STALE } from '../lib/query-config';

export function useStockQuote(symbol: string, market: Market, range: QuoteChartRange) {
  const { getStockQuoteUseCase } = useServices();

  return useQuery({
    queryKey: ['stock-quote', symbol, market, range],
    queryFn: () => getStockQuoteUseCase.execute(symbol, market, range),
    enabled: Boolean(symbol && market),
    staleTime: QUERY_STALE.quotes,
  });
}
