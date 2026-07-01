import { IPortfolioRepository } from '../../repositories';

/** 포트폴리오 대시보드 API 조회 use case */
export class GetDashboardUseCase {
  constructor(private readonly repo: IPortfolioRepository) {}

  /** repo.getDashboard — summary·holdings 반환 */
  execute() {
    return this.repo.getDashboard();
  }
}
