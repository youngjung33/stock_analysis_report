import { vi } from 'vitest';
import { Market } from '@sar/shared';
import {
  CreateCorporateActionUseCase,
  DeleteCorporateActionUseCase,
  ListCorporateActionsUseCase,
} from '@server/domain/usecases/corporate-actions/corporate-actions.use-cases';
import {
  createMockCorpActionRepo,
  createMockStock,
  createMockStockRepo,
} from '../../mocks/repositories.mock';

describe('ListCorporateActionsUseCase', () => {
  it('returns corporate actions for userId', async () => {
    const repo = createMockCorpActionRepo();
    repo.findByUser.mockResolvedValue([
      {
        id: 'ca-1',
        userId: 'user-1',
        stockId: 'stock-1',
        type: 'DIVIDEND',
        effectiveAt: new Date(),
        cashAmount: 1000,
        splitRatio: null,
        targetStockId: null,
        targetQuantity: null,
        targetPrice: null,
        memo: null,
        createdAt: new Date(),
        stock: createMockStock(),
        targetStock: null,
      },
    ]);

    const useCase = new ListCorporateActionsUseCase(repo);
    const items = await useCase.execute('user-1');
    expect(items).toHaveLength(1);
    expect(repo.findByUser).toHaveBeenCalledWith('user-1');
  });
});

describe('DeleteCorporateActionUseCase', () => {
  it('deletes by id and userId', async () => {
    const repo = createMockCorpActionRepo();
    const useCase = new DeleteCorporateActionUseCase(repo);
    await useCase.execute('ca-1', 'user-1');
    expect(repo.delete).toHaveBeenCalledWith('ca-1', 'user-1');
  });
});

describe('CreateCorporateActionUseCase', () => {
  it('creates corporate action with resolved stock', async () => {
    const stockRepo = createMockStockRepo();
    stockRepo.findBySymbolAndMarket.mockResolvedValue(createMockStock({ symbol: '005930', market: Market.KR }));
    const corpRepo = createMockCorpActionRepo();
    corpRepo.create.mockResolvedValue({
      id: 'ca-new',
      userId: 'user-1',
      stockId: 'stock-1',
      type: 'DIVIDEND',
      effectiveAt: new Date(),
      cashAmount: 500,
      splitRatio: null,
      targetStockId: null,
      targetQuantity: null,
      targetPrice: null,
      memo: null,
      createdAt: new Date(),
    });

    const useCase = new CreateCorporateActionUseCase(stockRepo, corpRepo);
    await useCase.execute({
      userId: 'user-1',
      stockSymbol: '005930',
      market: Market.KR,
      name: '삼성전자',
      type: 'DIVIDEND',
      effectiveAt: new Date(),
      cashAmount: 500,
    });

    expect(corpRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', type: 'DIVIDEND' }),
    );
  });
});
