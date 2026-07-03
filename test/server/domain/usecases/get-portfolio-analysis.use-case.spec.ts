import { GetPortfolioAnalysisUseCase } from '@server/domain/usecases/portfolio/get-portfolio-analysis.use-case';
import {
  createMockCorpActionRepo,
  createMockMarketData,
  createMockQuoteRepo,
  createMockStockRepo,
  createMockTransactionRepo,
} from '../../mocks/repositories.mock';

describe('GetPortfolioAnalysisUseCase', () => {
  it('returns empty analysis when user has no holdings', async () => {
    const stockRepo = createMockStockRepo();
    stockRepo.findHeldByUser.mockResolvedValue([]);
    const quoteRepo = createMockQuoteRepo();
    quoteRepo.findByStockIds.mockResolvedValue([]);

    const useCase = new GetPortfolioAnalysisUseCase(
      stockRepo,
      createMockTransactionRepo(),
      quoteRepo,
      createMockCorpActionRepo(),
      createMockMarketData(),
    );

    const result = await useCase.execute('user-1', ['1mo'], false);

    expect(result.holdingReturns).toEqual([]);
    expect(result.holdingsInsights).toEqual([]);
    expect(result.portfolioReturns.length).toBe(1);
    expect(stockRepo.findHeldByUser).toHaveBeenCalledWith('user-1');
  });
});
