import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServices } from './useServices';
import {
  invalidateAfterQuoteRefresh,
  invalidatePortfolioLocal,
  MARKET_QUERY_KEYS,
  QUERY_STALE,
} from '../lib/query-config';

export function useDashboard() {
  const { getDashboardUseCase, refreshQuotesUseCase } = useServices();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: MARKET_QUERY_KEYS.dashboard,
    queryFn: () => getDashboardUseCase.execute(),
    staleTime: QUERY_STALE.dashboard,
  });

  /** 자본금·거래 변경 — 시세 API 없이 집계만 갱신 */
  const reload = () => invalidatePortfolioLocal(queryClient);

  /** 시세 갱신 버튼 — 외부 API 후 관련 캐시 갱신 */
  const refresh = async () => {
    const result = await refreshQuotesUseCase.execute();
    await invalidateAfterQuoteRefresh(queryClient);
    return result;
  };

  return { ...query, reload, refresh };
}
