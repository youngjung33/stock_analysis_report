import { IPortfolioRepository } from '../../repositories';

/** 포트폴리오 기간수익률·벤치마크·인사이트 조회 use case */
export class GetPortfolioAnalysisUseCase {
  constructor(private readonly repo: IPortfolioRepository) {}

  /** repo.getAnalysis — PortfolioAnalysisResult 반환 */
  execute() {
    return this.repo.getAnalysis();
  }
}
