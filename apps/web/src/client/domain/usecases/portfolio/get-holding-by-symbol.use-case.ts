import { Market } from '@sar/shared';
import { IPortfolioRepository } from '../../repositories';

/** symbol·market 기준 단일 보유 API 조회 use case */
export class GetHoldingBySymbolUseCase {
  constructor(private readonly repo: IPortfolioRepository) {}

  /** repo.getHolding — HoldingResult 또는 null */
  execute(symbol: string, market: Market) {
    return this.repo.getHolding(symbol, market);
  }
}
