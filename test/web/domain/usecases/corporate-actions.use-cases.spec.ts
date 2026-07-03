import { CreateCorporateActionUseCase } from '@/client/domain/usecases/corporate-actions/create-corporate-action.use-case';
import { DeleteCorporateActionUseCase } from '@/client/domain/usecases/corporate-actions/delete-corporate-action.use-case';
import { ListCorporateActionsUseCase } from '@/client/domain/usecases/corporate-actions/list-corporate-actions.use-case';
import { ICorporateActionRepository } from '@/client/domain/repositories';
import { Market } from '@sar/shared';
import { vi } from 'vitest';

function createFakeCorpActionRepo(
  overrides: Partial<ICorporateActionRepository> = {},
): ICorporateActionRepository {
  return {
    create: vi.fn(),
    list: vi.fn().mockResolvedValue([]),
    delete: vi.fn(),
    ...overrides,
  };
}

describe('ListCorporateActionsUseCase (client)', () => {
  it('delegates to repository list', async () => {
    const repo = createFakeCorpActionRepo({
      list: vi.fn().mockResolvedValue([{ id: 'ca-1', type: 'DIVIDEND' }]),
    });
    const useCase = new ListCorporateActionsUseCase(repo);
    const items = await useCase.execute();
    expect(items).toHaveLength(1);
    expect(repo.list).toHaveBeenCalled();
  });
});

describe('DeleteCorporateActionUseCase (client)', () => {
  it('delegates to repository delete', async () => {
    const repo = createFakeCorpActionRepo();
    const useCase = new DeleteCorporateActionUseCase(repo);
    await useCase.execute('ca-1');
    expect(repo.delete).toHaveBeenCalledWith('ca-1');
  });
});

describe('CreateCorporateActionUseCase (client)', () => {
  it('delegates to repository create', async () => {
    const repo = createFakeCorpActionRepo();
    const useCase = new CreateCorporateActionUseCase(repo);
    await useCase.execute({
      stockSymbol: '005930',
      name: '삼성전자',
      market: Market.KR,
      type: 'DIVIDEND',
      effectiveAt: new Date().toISOString(),
    });
    expect(repo.create).toHaveBeenCalled();
  });
});
