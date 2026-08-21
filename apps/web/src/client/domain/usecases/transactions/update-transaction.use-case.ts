import { AppErrorCode } from '@sar/shared';
import { AppError } from '../../errors/app-error';
import { UpdateTransactionInput } from '../../models';
import { ITransactionRepository } from '../../repositories';

function validateUpdateInput(input: UpdateTransactionInput): void {
  if (input.quantity <= 0) {
    throw new AppError('', AppErrorCode.TRANSACTION_QUANTITY_INVALID);
  }
  if (input.price <= 0) {
    throw new AppError('', AppErrorCode.TRANSACTION_PRICE_INVALID);
  }
}

/** 거래 수정 API 호출 use case */
export class UpdateTransactionUseCase {
  constructor(private readonly repo: ITransactionRepository) {}

  execute(id: string, input: UpdateTransactionInput) {
    validateUpdateInput(input);
    return this.repo.update(id, input);
  }
}
