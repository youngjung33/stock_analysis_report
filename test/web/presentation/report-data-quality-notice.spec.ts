import { describe, expect, it } from 'vitest';
import {
  createEnrichmentBatchQuality,
  type MarketReportDataQuality,
  type StockReportDataQuality,
} from '@sar/shared';
import {
  hasMarketReportDataQualityNotice,
  hasStockReportDataQualityNotice,
} from '@/presentation/components/ReportDataQualityNotice';

describe('ReportDataQualityNotice helpers', () => {
  it('hides market notice when all sources ok and enrichment complete', () => {
    const enrichment = createEnrichmentBatchQuality(2);
    for (const slice of Object.values(enrichment)) {
      slice.received = slice.requested;
    }
    const quality: MarketReportDataQuality = {
      news: { krGoogle: 'ok', usGoogle: 'ok', finnhubGeneral: 'ok' },
      enrichment,
      incompleteEnrichment: false,
    };
    expect(hasMarketReportDataQualityNotice(quality)).toBe(false);
  });

  it('shows market notice when a news source failed', () => {
    const quality: MarketReportDataQuality = {
      news: { krGoogle: 'failed', usGoogle: 'ok', finnhubGeneral: 'empty' },
      enrichment: createEnrichmentBatchQuality(0),
      incompleteEnrichment: false,
    };
    expect(hasMarketReportDataQualityNotice(quality)).toBe(true);
  });

  it('shows stock notice when enrichment incomplete', () => {
    const enrichment = createEnrichmentBatchQuality(3);
    enrichment.quotes.failed = 1;
    const quality: StockReportDataQuality = {
      priceSource: 'live_chart',
      quoteAsOf: new Date().toISOString(),
      enrichment,
      incompleteEnrichment: true,
    };
    expect(hasStockReportDataQualityNotice(quality)).toBe(true);
  });

  it('hides stock notice when enrichment is complete', () => {
    const enrichment = createEnrichmentBatchQuality(1);
    for (const slice of Object.values(enrichment)) {
      slice.received = slice.requested;
    }
    const quality: StockReportDataQuality = {
      priceSource: 'live_chart',
      quoteAsOf: new Date().toISOString(),
      enrichment,
      incompleteEnrichment: false,
    };
    expect(hasStockReportDataQualityNotice(quality)).toBe(false);
  });
});
