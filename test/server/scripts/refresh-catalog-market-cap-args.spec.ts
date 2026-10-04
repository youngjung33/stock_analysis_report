import { describe, expect, it } from 'vitest';
import { Market } from '@sar/shared';
import { parseRefreshCatalogMarketCapArgs } from '../../../apps/web/scripts/refresh-catalog-market-cap';

describe('parseRefreshCatalogMarketCapArgs', () => {
  it('defaults to full catalog batches', () => {
    const args = parseRefreshCatalogMarketCapArgs(['node', 'script.ts']);
    expect(args.market).toBeUndefined();
    expect(args.maxRows).toBeUndefined();
    expect(args.batchSize).toBe(200);
  });

  it('parses market, limit, and batch-size', () => {
    const args = parseRefreshCatalogMarketCapArgs([
      'node',
      'script.ts',
      '--market',
      Market.US,
      '--limit',
      '50',
      '--batch-size',
      '10',
    ]);
    expect(args.market).toBe(Market.US);
    expect(args.maxRows).toBe(50);
    expect(args.batchSize).toBe(10);
  });
});
