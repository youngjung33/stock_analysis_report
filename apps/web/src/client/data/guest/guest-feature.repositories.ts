import { Market } from '@sar/shared';
import { CreateCorporateActionInput, ICorporateActionRepository, IWatchlistRepository } from '../../domain/repositories';
import {
  getGuestWatchlist,
  removeGuestWatchlistItem,
  saveGuestCorporateAction,
  saveGuestWatchlistItem,
} from '../guest/guest-storage';

/** 게스트 세션용 관심종목 repository */
export class GuestWatchlistRepository implements IWatchlistRepository {
  list() {
    return Promise.resolve(getGuestWatchlist());
  }

  add(input: { symbol: string; name: string; market: Market }) {
    return Promise.resolve(saveGuestWatchlistItem(input));
  }

  remove(id: string) {
    removeGuestWatchlistItem(id);
    return Promise.resolve();
  }
}

/** 게스트 세션용 기업행위 repository */
export class GuestCorporateActionRepository implements ICorporateActionRepository {
  create(input: CreateCorporateActionInput) {
    saveGuestCorporateAction(input);
    return Promise.resolve();
  }
}
