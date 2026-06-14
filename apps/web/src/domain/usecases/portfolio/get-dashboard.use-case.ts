import { IPortfolioRepository } from '../../repositories';

export class GetDashboardUseCase {
  constructor(private readonly repo: IPortfolioRepository) {}

  execute() {
    return this.repo.getDashboard();
  }
}
