/** 외부 데이터 수집 결과 — 빈 배열과 수집 실패를 구분 */

export type DataSourceStatus = 'ok' | 'empty' | 'failed';

export interface MarketNewsSourceQuality {
  krGoogle: DataSourceStatus;
  usGoogle: DataSourceStatus;
  finnhubGeneral: DataSourceStatus;
}

export interface EnrichmentSliceQuality {
  requested: number;
  received: number;
  cacheHits: number;
  failed: number;
}

export function createEnrichmentSliceQuality(requested = 0): EnrichmentSliceQuality {
  return { requested, received: 0, cacheHits: 0, failed: 0 };
}

export interface EnrichmentBatchQuality {
  quotes: EnrichmentSliceQuality;
  technical: EnrichmentSliceQuality;
  news: EnrichmentSliceQuality;
  events: EnrichmentSliceQuality;
}

export function createEnrichmentBatchQuality(requestedSymbols: number): EnrichmentBatchQuality {
  return {
    quotes: createEnrichmentSliceQuality(requestedSymbols),
    technical: createEnrichmentSliceQuality(requestedSymbols),
    news: createEnrichmentSliceQuality(requestedSymbols),
    events: createEnrichmentSliceQuality(requestedSymbols),
  };
}

export function isEnrichmentBatchIncomplete(quality: EnrichmentBatchQuality): boolean {
  const slices = [quality.quotes, quality.technical, quality.news, quality.events];
  return slices.some((s) => s.failed > 0 || (s.requested > 0 && s.received < s.requested));
}

export interface StockReportDataQuality {
  /** 종목 리포트 가격은 항상 live 차트 조회 */
  priceSource: 'live_chart';
  quoteAsOf: string;
  enrichment: EnrichmentBatchQuality;
  incompleteEnrichment: boolean;
}

export interface MarketReportDataQuality {
  news: MarketNewsSourceQuality;
  enrichment: EnrichmentBatchQuality;
  incompleteEnrichment: boolean;
}
