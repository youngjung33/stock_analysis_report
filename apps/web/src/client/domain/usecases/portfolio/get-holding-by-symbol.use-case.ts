import { Market } from '@sar/shared';
import { IPortfolioRepository } from '../../repositories';

export class GetHoldingBySymbolUseCase {
  constructor(private readonly repo: IPortfolioRepository) {}

  execute(symbol: string, market: Market) {
    return this.repo.getHolding(symbol, market);
  }
}
