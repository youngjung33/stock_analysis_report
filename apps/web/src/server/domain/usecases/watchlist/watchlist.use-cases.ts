import { Market } from '@sar/shared';
import { WatchlistItemEntity } from '../../entities';
import { IWatchlistRepository } from '../../repositories';

export class ListWatchlistUseCase {
  constructor(private readonly watchlistRepo: IWatchlistRepository) {}

  execute(userId: string) {
    return this.watchlistRepo.findByUser(userId);
  }
}

export interface AddWatchlistInput {
  userId: string;
  symbol: string;
  name: string;
  market: Market;
}

export class AddWatchlistUseCase {
  constructor(private readonly watchlistRepo: IWatchlistRepository) {}

  async execute(input: AddWatchlistInput): Promise<WatchlistItemEntity> {
    const existing = await this.watchlistRepo.findByUserSymbolMarket(
      input.userId,
      input.symbol,
      input.market,
    );
    if (existing) return existing;

    return this.watchlistRepo.create({
      userId: input.userId,
      symbol: input.symbol,
      name: input.name,
      market: input.market,
    });
  }
}

export class DeleteWatchlistUseCase {
  constructor(private readonly watchlistRepo: IWatchlistRepository) {}

  execute(id: string, userId: string) {
    return this.watchlistRepo.delete(id, userId);
  }
}
