import { describe, expect, it, vi } from 'vitest';
import { Market } from '@sar/shared';
import { buildCandidatePoolWithCatalog } from '@server/domain/usecases/market/build-candidate-pool-with-catalog';

describe('buildCandidatePoolWithCatalog', () => {
  it('merges catalog yahooSymbol for watchlist symbols', async () => {
    const catalogRepo = {
      findBySymbols: vi.fn(async (symbols: string[], market: Market) =>
        symbols.map((symbol) => ({
          symbol,
          market,
          name: 'Catalog Name',
          yahooSymbol: market === Market.KR ? `${symbol}.KS` : symbol,
        })),
      ),
    };

    const pool = await buildCandidatePoolWithCatalog(catalogRepo as never, {
      userWatchlist: [{ symbol: '035720', market: Market.KR, name: '카카오' }],
    });

    const kakao = pool.find((c) => c.symbol === '035720' && c.market === Market.KR);
    expect(kakao?.yahooSymbol).toBe('035720.KS');
    expect(kakao?.name).toBe('Catalog Name');
  });

  it('seeds guest baseline and merges catalog for empty personalization', async () => {
    const catalogRepo = {
      findBySymbols: vi.fn(async (symbols: string[]) =>
        symbols.map((symbol) => ({
          symbol,
          market: Market.KR,
          name: `Name ${symbol}`,
          yahooSymbol: `${symbol}.KS`,
        })),
      ),
    };

    const pool = await buildCandidatePoolWithCatalog(catalogRepo as never, {});
    expect(pool.length).toBeGreaterThan(0);
    expect(catalogRepo.findBySymbols).toHaveBeenCalled();
    const samsung = pool.find((c) => c.symbol === '005930' && c.market === Market.KR);
    expect(samsung?.yahooSymbol).toBe('005930.KS');
  });
});
