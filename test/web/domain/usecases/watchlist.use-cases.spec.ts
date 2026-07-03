import { vi } from 'vitest';
import { Market } from '@sar/shared';
import {
  AddWatchlistUseCase,
  ListWatchlistUseCase,
  RemoveWatchlistUseCase,
} from '@/client/domain/usecases/watchlist/watchlist.use-cases';
import { IWatchlistRepository } from '@/client/domain/repositories';

function createFakeWatchlistRepo(
  overrides: Partial<IWatchlistRepository> = {},
): IWatchlistRepository {
  return {
    list: vi.fn().mockResolvedValue([]),
    add: vi.fn(),
    remove: vi.fn(),
    ...overrides,
  };
}

describe('ListWatchlistUseCase (client)', () => {
  it('delegates to repository list', async () => {
    const repo = createFakeWatchlistRepo({
      list: vi.fn().mockResolvedValue([
        { id: 'wl-1', symbol: 'AAPL', name: 'Apple', market: Market.US, createdAt: new Date().toISOString() },
      ]),
    });
    const useCase = new ListWatchlistUseCase(repo);
    const items = await useCase.execute();
    expect(items).toHaveLength(1);
    expect(repo.list).toHaveBeenCalled();
  });
});

describe('AddWatchlistUseCase (client)', () => {
  it('delegates to repository add', async () => {
    const repo = createFakeWatchlistRepo();
    const useCase = new AddWatchlistUseCase(repo);
    await useCase.execute({ symbol: 'AAPL', name: 'Apple', market: Market.US });
    expect(repo.add).toHaveBeenCalledWith({ symbol: 'AAPL', name: 'Apple', market: Market.US });
  });
});

describe('RemoveWatchlistUseCase (client)', () => {
  it('delegates to repository remove', async () => {
    const repo = createFakeWatchlistRepo();
    const useCase = new RemoveWatchlistUseCase(repo);
    await useCase.execute('wl-1');
    expect(repo.remove).toHaveBeenCalledWith('wl-1');
  });
});
