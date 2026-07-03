import { vi } from 'vitest';
import { Market } from '@sar/shared';
import {
  AddWatchlistUseCase,
  DeleteWatchlistUseCase,
  ListWatchlistUseCase,
} from '@server/domain/usecases/watchlist/watchlist.use-cases';
import { createMockWatchlistRepo } from '../../mocks/repositories.mock';

describe('ListWatchlistUseCase', () => {
  it('returns items for userId from JWT context', async () => {
    const repo = createMockWatchlistRepo();
    repo.findByUser.mockResolvedValue([
      { id: 'wl-1', userId: 'user-1', symbol: '005930', name: '삼성전자', market: Market.KR, createdAt: new Date() },
    ]);
    const useCase = new ListWatchlistUseCase(repo);
    const items = await useCase.execute('user-1');
    expect(items).toHaveLength(1);
    expect(repo.findByUser).toHaveBeenCalledWith('user-1');
  });
});

describe('AddWatchlistUseCase', () => {
  it('returns existing item when duplicate', async () => {
    const existing = {
      id: 'wl-1',
      userId: 'user-1',
      symbol: '005930',
      name: '삼성전자',
      market: Market.KR,
      createdAt: new Date(),
    };
    const repo = createMockWatchlistRepo();
    repo.findByUserSymbolMarket.mockResolvedValue(existing);

    const useCase = new AddWatchlistUseCase(repo);
    const result = await useCase.execute({
      userId: 'user-1',
      symbol: '005930',
      name: '삼성전자',
      market: Market.KR,
    });

    expect(result).toBe(existing);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('creates new watchlist item', async () => {
    const repo = createMockWatchlistRepo();
    repo.findByUserSymbolMarket.mockResolvedValue(null);
    repo.create.mockResolvedValue({
      id: 'wl-new',
      userId: 'user-1',
      symbol: 'AAPL',
      name: 'Apple',
      market: Market.US,
      createdAt: new Date(),
    });

    const useCase = new AddWatchlistUseCase(repo);
    await useCase.execute({
      userId: 'user-1',
      symbol: 'AAPL',
      name: 'Apple',
      market: Market.US,
    });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', symbol: 'AAPL' }),
    );
  });
});

describe('DeleteWatchlistUseCase', () => {
  it('deletes by id and userId', async () => {
    const repo = createMockWatchlistRepo();
    const useCase = new DeleteWatchlistUseCase(repo);
    await useCase.execute('wl-1', 'user-1');
    expect(repo.delete).toHaveBeenCalledWith('wl-1', 'user-1');
  });
});
