import { describe, expect, it, vi } from 'vitest';
import { Market } from '@sar/shared';
import { BuildStockEnrichmentUseCase } from '@server/domain/usecases/market/build-stock-enrichment.use-case';

describe('BuildStockEnrichmentUseCase', () => {
  it('passes recentTitles to events when headlineSample is empty', async () => {
    const fetchEventsUseCase = {
      execute: vi.fn().mockResolvedValue([]),
    };
    const fetchNewsUseCase = {
      execute: vi.fn().mockResolvedValue([
        {
          symbol: 'AAPL',
          market: Market.US,
          headlineSample: '',
          recentTitles: ['Apple Q3 earnings beat'],
          dedupeKey: 'news:AAPL:x',
        },
      ]),
    };

    const useCase = new BuildStockEnrichmentUseCase(
      { execute: vi.fn().mockResolvedValue([]) } as never,
      { execute: vi.fn().mockResolvedValue([]) } as never,
      fetchNewsUseCase as never,
      fetchEventsUseCase as never,
      { execute: vi.fn().mockResolvedValue([]) } as never,
    );

    await useCase.execute([
      {
        symbol: 'AAPL',
        name: 'Apple',
        market: Market.US,
        currency: 'USD',
      },
    ]);

    expect(fetchEventsUseCase.execute).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          symbol: 'AAPL',
          headlineSample: 'Apple Q3 earnings beat',
        }),
      ],
      expect.objectContaining({ quality: expect.anything() }),
    );
  });

  it('skips quote fetch when skipQuotes is true', async () => {
    const fetchQuotesUseCase = { execute: vi.fn().mockResolvedValue([]) };
    const useCase = new BuildStockEnrichmentUseCase(
      fetchQuotesUseCase as never,
      { execute: vi.fn().mockResolvedValue([]) } as never,
      { execute: vi.fn().mockResolvedValue([]) } as never,
      { execute: vi.fn().mockResolvedValue([]) } as never,
      { execute: vi.fn().mockResolvedValue([]) } as never,
    );

    const result = await useCase.execute(
      [
        {
          symbol: '005930',
          name: '삼성전자',
          market: Market.KR,
          currency: 'KRW',
        },
      ],
      { skipQuotes: true },
    );

    expect(fetchQuotesUseCase.execute).not.toHaveBeenCalled();
    expect(result.candidateQuotes).toEqual([]);
  });
});
