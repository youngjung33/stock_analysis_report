import { Market } from '@sar/shared';
import { IWatchlistRepository } from '../../repositories';

/** 관심종목 목록 조회 use case */
export class ListWatchlistUseCase {
  constructor(private readonly watchlistRepo: IWatchlistRepository) {}

  /** watchlistRepo.list — 관심종목 배열 반환 */
  execute() {
    return this.watchlistRepo.list();
  }
}

/** 관심종목 추가 use case */
export class AddWatchlistUseCase {
  constructor(private readonly watchlistRepo: IWatchlistRepository) {}

  /** watchlistRepo.add — 추가된 항목 반환 */
  execute(input: { symbol: string; name: string; market: Market }) {
    return this.watchlistRepo.add(input);
  }
}

/** 관심종목 삭제 use case */
export class RemoveWatchlistUseCase {
  constructor(private readonly watchlistRepo: IWatchlistRepository) {}

  /** watchlistRepo.remove — id 기준 삭제 */
  execute(id: string) {
    return this.watchlistRepo.remove(id);
  }
}
