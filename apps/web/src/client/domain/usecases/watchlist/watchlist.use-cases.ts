import { Market } from '@sar/shared';
import { IWatchlistRepository } from '../../repositories';

/** 관심종목 목록 조회 use case */
export class ListWatchlistUseCase {
  constructor(private readonly watchlistRepo: IWatchlistRepository) {}

  execute() {
    return this.watchlistRepo.list();
  }
}

/** 관심종목 추가 use case */
export class AddWatchlistUseCase {
  constructor(private readonly watchlistRepo: IWatchlistRepository) {}

  execute(input: { symbol: string; name: string; market: Market }) {
    return this.watchlistRepo.add(input);
  }
}

/** 관심종목 삭제 use case */
export class RemoveWatchlistUseCase {
  constructor(private readonly watchlistRepo: IWatchlistRepository) {}

  execute(id: string) {
    return this.watchlistRepo.remove(id);
  }
}
