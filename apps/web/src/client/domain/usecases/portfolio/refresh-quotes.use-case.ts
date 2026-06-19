import { IPortfolioRepository } from '../../repositories';

export class RefreshQuotesUseCase {
  constructor(private readonly repo: IPortfolioRepository) {}

  execute() {
    return this.repo.refreshQuotes();
  }
}
