import { Market } from '@sar/shared';
import { WatchlistItemEntity } from '../../entities';
import { IWatchlistRepository } from '../../repositories';

/** 관심종목 목록 조회 use case */
export class ListWatchlistUseCase {
  constructor(private readonly watchlistRepo: IWatchlistRepository) {}

  /** userId 기준 관심종목 목록 반환 */
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

/** 관심종목 추가 use case */
export class AddWatchlistUseCase {
  constructor(private readonly watchlistRepo: IWatchlistRepository) {}

  /** 중복이면 기존 항목, 없으면 새 관심종목 생성 */
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

/** 관심종목 삭제 use case */
export class DeleteWatchlistUseCase {
  constructor(private readonly watchlistRepo: IWatchlistRepository) {}

  /** id·userId 일치 관심종목 삭제 */
  execute(id: string, userId: string) {
    return this.watchlistRepo.delete(id, userId);
  }
}
