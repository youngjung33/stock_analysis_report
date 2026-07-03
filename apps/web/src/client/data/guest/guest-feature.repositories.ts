import { Market } from '@sar/shared';
import { CorporateAction } from '../../domain/models';
import { CreateCorporateActionInput, ICorporateActionRepository, IWatchlistRepository } from '../../domain/repositories';
import {
  getGuestWatchlist,
  listGuestCorporateActions,
  removeGuestWatchlistItem,
  saveGuestCorporateAction,
  saveGuestWatchlistItem,
} from '../guest/guest-storage';

function deleteGuestCorporateAction(id: string): void {
  const storeKey = 'sar_guest_data';
  const raw = sessionStorage.getItem(storeKey);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw) as { corporateActions?: { id: string }[] };
    parsed.corporateActions = (parsed.corporateActions ?? []).filter((a) => a.id !== id);
    sessionStorage.setItem(storeKey, JSON.stringify(parsed));
  } catch {
    // ignore
  }
}

function mapGuestCorporateAction(
  action: ReturnType<typeof listGuestCorporateActions>[number],
): CorporateAction {
  return {
    id: action.id,
    stockId: action.stockId,
    type: action.type,
    effectiveAt: action.effectiveAt,
    cashAmount: action.cashAmount ?? null,
    splitRatio: action.splitRatio ?? null,
    targetStockId: null,
    targetQuantity: action.targetQuantity ?? null,
    targetPrice: action.targetPrice ?? null,
    memo: action.memo ?? null,
  };
}

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

  list() {
    return Promise.resolve(listGuestCorporateActions().map(mapGuestCorporateAction));
  }

  delete(id: string) {
    deleteGuestCorporateAction(id);
    return Promise.resolve();
  }
}
