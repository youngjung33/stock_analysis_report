import { describe, expect, it, vi } from 'vitest';
import { AppErrorCode, CashLedgerType } from '@sar/shared';
import { ValidationError } from '@server/domain/errors/domain.errors';
import { RecordCashEntryUseCase } from '@server/domain/usecases/cash/cash.use-cases';

describe('RecordCashEntryUseCase', () => {
  it('rejects zero amount', async () => {
    const useCase = new RecordCashEntryUseCase({ create: vi.fn() } as never);
    await expect(
      useCase.execute({
        userId: 'user-1',
        currency: 'KRW',
        type: CashLedgerType.DEPOSIT,
        amount: 0,
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('rejects withdraw when balance insufficient', async () => {
    const cashRepo = {
      findByUser: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
    };
    const useCase = new RecordCashEntryUseCase(cashRepo as never);

    await expect(
      useCase.execute({
        userId: 'user-1',
        currency: 'KRW',
        type: CashLedgerType.WITHDRAW,
        amount: 1000,
      }),
    ).rejects.toMatchObject({ code: AppErrorCode.CASH_INSUFFICIENT });
  });

  it('stores signed amount for withdraw', async () => {
    const cashRepo = {
      findByUser: vi.fn().mockResolvedValue([
        {
          currency: 'KRW',
          amount: 5000,
          type: CashLedgerType.DEPOSIT,
        },
      ]),
      create: vi.fn().mockResolvedValue({ id: 'cash-1' }),
    };
    const useCase = new RecordCashEntryUseCase(cashRepo as never);

    await useCase.execute({
      userId: 'user-1',
      currency: 'KRW',
      type: CashLedgerType.WITHDRAW,
      amount: 1000,
    });

    expect(cashRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ amount: -1000, type: CashLedgerType.WITHDRAW }),
    );
  });
});
