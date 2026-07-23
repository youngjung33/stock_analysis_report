import { AppErrorCode } from '@sar/shared';
import { AppError } from '../../errors/app-error';
import { CreateTransactionInput } from '../../models';
import { ITransactionRepository } from '../../repositories';

function validateTransactionInput(input: CreateTransactionInput): void {
  if (!input.stockSymbol.trim() || !input.name.trim()) {
    throw new AppError('', AppErrorCode.STOCK_REQUIRED);
  }
  if (input.quantity <= 0) {
    throw new AppError('', AppErrorCode.TRANSACTION_QUANTITY_INVALID);
  }
  if (input.price <= 0) {
    throw new AppError('', AppErrorCode.TRANSACTION_PRICE_INVALID);
  }
}

/** 거래 등록 API 호출 use case */
export class CreateTransactionUseCase {
  constructor(private readonly repo: ITransactionRepository) {}

  /** 클라이언트 검증 후 repo.create */
  execute(input: CreateTransactionInput) {
    validateTransactionInput(input);
    return this.repo.create(input);
  }
}
