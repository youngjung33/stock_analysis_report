import { AppError } from '../../errors/app-error';
import { CreateTransactionInput } from '../../models';
import { ITransactionRepository } from '../../repositories';

function validateTransactionInput(input: CreateTransactionInput): void {
  if (!input.stockSymbol.trim()) {
    throw new AppError('종목을 검색해서 선택해 주세요.');
  }
  if (!input.name.trim()) {
    throw new AppError('종목을 검색해서 선택해 주세요.');
  }
  if (input.quantity <= 0) {
    throw new AppError('수량은 0보다 커야 합니다.');
  }
  if (input.price <= 0) {
    throw new AppError('단가는 0보다 커야 합니다.');
  }
}

export class CreateTransactionUseCase {
  constructor(private readonly repo: ITransactionRepository) {}

  execute(input: CreateTransactionInput) {
    validateTransactionInput(input);
    return this.repo.create(input);
  }
}
