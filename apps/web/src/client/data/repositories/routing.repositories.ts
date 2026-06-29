import {
  ICorporateActionRepository,
  IPortfolioRepository,
  ITransactionRepository,
  IWatchlistRepository,
} from '../../domain/repositories';
import { guestSession } from '../guest/guest-session';
import {
  ApiAuthRepository,
  ApiCorporateActionRepository,
  ApiMarketRepository,
  ApiPortfolioRepository,
  ApiTransactionRepository,
  ApiWatchlistRepository,
} from './api.repositories';
import { GuestCorporateActionRepository, GuestWatchlistRepository } from '../guest/guest-feature.repositories';
import { GuestPortfolioRepository } from '../guest/guest-portfolio.repository';
import { GuestTransactionRepository } from '../guest/guest-transaction.repository';

const guestTransactionRepository = new GuestTransactionRepository();
const guestPortfolioRepository = new GuestPortfolioRepository();
const guestWatchlistRepository = new GuestWatchlistRepository();
const guestCorporateActionRepository = new GuestCorporateActionRepository();

const apiTransactionRepository = new ApiTransactionRepository();
const apiPortfolioRepository = new ApiPortfolioRepository();
const apiMarketRepository = new ApiMarketRepository();
const apiWatchlistRepository = new ApiWatchlistRepository();
const apiCorporateActionRepository = new ApiCorporateActionRepository();

function pickTransactionRepo(): ITransactionRepository {
  return guestSession.isActive() ? guestTransactionRepository : apiTransactionRepository;
}

function pickPortfolioRepo(): IPortfolioRepository {
  return guestSession.isActive() ? guestPortfolioRepository : apiPortfolioRepository;
}

function pickWatchlistRepo(): IWatchlistRepository {
  return guestSession.isActive() ? guestWatchlistRepository : apiWatchlistRepository;
}

function pickCorporateActionRepo(): ICorporateActionRepository {
  return guestSession.isActive() ? guestCorporateActionRepository : apiCorporateActionRepository;
}

export const authRepository = new ApiAuthRepository();

export const marketRepository = apiMarketRepository;

export const transactionRepository: ITransactionRepository = {
  create(input) {
    return pickTransactionRepo().create(input);
  },
  list(filters) {
    return pickTransactionRepo().list(filters);
  },
  delete(id) {
    return pickTransactionRepo().delete(id);
  },
};

export const portfolioRepository: IPortfolioRepository = {
  getDashboard() {
    return pickPortfolioRepo().getDashboard();
  },
  getHolding(symbol, market) {
    return pickPortfolioRepo().getHolding(symbol, market);
  },
  getAnalysis() {
    return pickPortfolioRepo().getAnalysis();
  },
  refreshQuotes() {
    return pickPortfolioRepo().refreshQuotes();
  },
};

export const watchlistRepository: IWatchlistRepository = {
  list() {
    return pickWatchlistRepo().list();
  },
  add(input) {
    return pickWatchlistRepo().add(input);
  },
  remove(id) {
    return pickWatchlistRepo().remove(id);
  },
};

export const corporateActionRepository: ICorporateActionRepository = {
  create(input) {
    return pickCorporateActionRepo().create(input);
  },
};

export {
  ApiAuthRepository,
  ApiCorporateActionRepository,
  ApiMarketRepository,
  ApiPortfolioRepository,
  ApiTransactionRepository,
  ApiWatchlistRepository,
};
