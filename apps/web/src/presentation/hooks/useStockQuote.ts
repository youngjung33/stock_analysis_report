import { useQuery } from '@tanstack/react-query';
import { Market, QuoteChartRange } from '@sar/shared';
import { StockQuoteSnapshot } from '@/client/domain/models';
import { apiClient } from '@/client/data/api/client';

export function useStockQuote(symbol: string, market: Market, range: QuoteChartRange) {
  return useQuery({
    queryKey: ['stock-quote', symbol, market, range],
    queryFn: async () => {
      const { data } = await apiClient.get<StockQuoteSnapshot>('/market/quote', {
        params: { symbol, market, range },
      });
      return data;
    },
    enabled: Boolean(symbol && market),
  });
}
