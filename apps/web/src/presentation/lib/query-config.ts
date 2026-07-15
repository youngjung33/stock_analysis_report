import { QueryClient } from '@tanstack/react-query';

/**
 * 시세·리포트 캐시 TTL — 갱신 버튼 또는 invalidate 전까지 재사용.
 * (React Query staleTime: 이 시간 동안은 재요청하지 않음)
 */
export const QUERY_STALE = {
  dashboard: 5 * 60_000,
  quotes: 5 * 60_000,
  marketReport: 15 * 60_000,
  portfolioAnalysis: 10 * 60_000,
  marketStatus: 5 * 60_000,
  portfolioCapital: 5 * 60_000,
  transactions: 2 * 60_000,
} as const;

export const QUERY_GC_TIME = 30 * 60_000;

export const MARKET_QUERY_KEYS = {
  dashboard: ['dashboard'] as const,
  featuredQuotes: ['featured-quotes'] as const,
  marketAnalysis: ['market-analysis'] as const,
  marketStatus: ['market-status'] as const,
  portfolioAnalysis: ['portfolio', 'analysis'] as const,
  portfolioSimulation: ['portfolio', 'simulation'] as const,
  cashSummary: ['cash', 'summary'] as const,
  portfolioPreferences: ['portfolio', 'preferences'] as const,
  transactions: ['transactions'] as const,
  stockQuoteRoot: ['stock-quote'] as const,
} as const;

export function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: QUERY_STALE.quotes,
        gcTime: QUERY_GC_TIME,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: 1,
      },
    },
  });
}

/** 시세 갱신 버튼 — 외부 API 호출 후 관련 캐시 무효화 */
export function invalidateAfterQuoteRefresh(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: MARKET_QUERY_KEYS.dashboard }),
    queryClient.invalidateQueries({ queryKey: MARKET_QUERY_KEYS.featuredQuotes }),
    queryClient.invalidateQueries({ queryKey: MARKET_QUERY_KEYS.portfolioAnalysis }),
    queryClient.invalidateQueries({ queryKey: MARKET_QUERY_KEYS.portfolioSimulation }),
    queryClient.invalidateQueries({ queryKey: MARKET_QUERY_KEYS.stockQuoteRoot }),
  ]);
}

/** 자본금·거래 변경 — 로컬/DB 집계만 다시 불러옴 (시세 API X) */
export function invalidatePortfolioLocal(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: MARKET_QUERY_KEYS.dashboard }),
    queryClient.invalidateQueries({ queryKey: MARKET_QUERY_KEYS.portfolioSimulation }),
    queryClient.invalidateQueries({ queryKey: MARKET_QUERY_KEYS.cashSummary }),
    queryClient.invalidateQueries({ queryKey: MARKET_QUERY_KEYS.portfolioPreferences }),
    queryClient.invalidateQueries({ queryKey: MARKET_QUERY_KEYS.transactions }),
    queryClient.invalidateQueries({ queryKey: MARKET_QUERY_KEYS.portfolioAnalysis }),
  ]);
}
