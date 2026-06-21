import { IPortfolioRepository, ITransactionRepository } from '../../domain/repositories';
import { guestSession } from '../guest/guest-session';
import {
  ApiAuthRepository,
  ApiPortfolioRepository,
  ApiTransactionRepository,
} from './api.repositories';
import { GuestPortfolioRepository } from '../guest/guest-portfolio.repository';
import { GuestTransactionRepository } from '../guest/guest-transaction.repository';

const guestTransactionRepository = new GuestTransactionRepository();
const guestPortfolioRepository = new GuestPortfolioRepository();

const apiTransactionRepository = new ApiTransactionRepository();
const apiPortfolioRepository = new ApiPortfolioRepository();

function pickTransactionRepo(): ITransactionRepository {
  return guestSession.isActive() ? guestTransactionRepository : apiTransactionRepository;
}

function pickPortfolioRepo(): IPortfolioRepository {
  return guestSession.isActive() ? guestPortfolioRepository : apiPortfolioRepository;
}

export const authRepository = new ApiAuthRepository();

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
  refreshQuotes() {
    return pickPortfolioRepo().refreshQuotes();
  },
};

export { ApiAuthRepository, ApiPortfolioRepository, ApiTransactionRepository };
