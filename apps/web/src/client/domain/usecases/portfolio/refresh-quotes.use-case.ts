import { IPortfolioRepository } from '../../repositories';

/** 보유 종목 시세 갱신 API 호출 use case */
export class RefreshQuotesUseCase {
  constructor(private readonly repo: IPortfolioRepository) {}

  /** repo.refreshQuotes — 갱신 결과 반환 */
  execute() {
    return this.repo.refreshQuotes();
  }
}
