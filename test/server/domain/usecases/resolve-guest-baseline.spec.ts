import { describe, expect, it, vi } from 'vitest';
import { Market } from '@sar/shared';
import { resolveGuestBaselineSymbols } from '@server/domain/usecases/market/resolve-guest-baseline';

describe('resolveGuestBaselineSymbols', () => {
  it('prefers catalog marketCap order over fallback', async () => {
    const catalogRepo = {
      listTopByMarketCap: vi.fn(async (market: Market) => {
        if (market === Market.KR) {
          return [
            { symbol: '000660', name: 'SK하이닉스', market: Market.KR, yahooSymbol: '000660.KS' },
            { symbol: '005930', name: '삼성전자', market: Market.KR, yahooSymbol: '005930.KS' },
          ];
        }
        return [{ symbol: 'NVDA', name: 'NVIDIA', market: Market.US, yahooSymbol: 'NVDA' }];
      }),
    };

    const rows = await resolveGuestBaselineSymbols(catalogRepo as never);
    expect(rows[0]?.symbol).toBe('000660');
    expect(rows.some((r) => r.market === Market.US && r.symbol === 'NVDA')).toBe(true);
  });

  it('fills from fallback when catalog has too few rows', async () => {
    const catalogRepo = {
      listTopByMarketCap: vi.fn(async () => []),
    };

    const rows = await resolveGuestBaselineSymbols(catalogRepo as never);
    expect(rows.some((r) => r.symbol === '005930' && r.market === Market.KR)).toBe(true);
    expect(rows.some((r) => r.symbol === 'AAPL' && r.market === Market.US)).toBe(true);
  });
});
