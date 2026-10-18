import { describe, expect, it, vi } from 'vitest';
import {
  HEAVY_API_PLATFORM_MAX_DURATION_SEC,
  estimateHeavyAnalysisWaitSec,
} from '@sar/shared';

describe('estimateHeavyAnalysisWaitSec', () => {
  it('market deep analysis expects longer queue than single stock focus', () => {
    const market = estimateHeavyAnalysisWaitSec('marketDeep');
    const stock = estimateHeavyAnalysisWaitSec('stockFocus');
    expect(market.typicalMaxSec).toBeGreaterThan(stock.typicalMaxSec);
    expect(market.typicalMinSec).toBeGreaterThanOrEqual(stock.typicalMinSec);
  });

  it('scales typical max with US symbol count via queue gap env', () => {
    vi.stubEnv('US_FINNHUB_QUEUE_GAP_MS', '2000');
    const few = estimateHeavyAnalysisWaitSec('marketDeep', { usSymbolCount: 2 });
    const many = estimateHeavyAnalysisWaitSec('marketDeep', { usSymbolCount: 20 });
    expect(many.typicalMaxSec).toBeGreaterThan(few.typicalMaxSec);
    vi.unstubAllEnvs();
  });

  it('exposes platform max duration constant for UI', () => {
    expect(HEAVY_API_PLATFORM_MAX_DURATION_SEC).toBe(25);
  });
});
