import { AppError } from '../../domain/errors/app-error';
import { CreateTransactionInput } from '../../domain/models';
import { IPortfolioRepository, ITransactionRepository } from '../../domain/repositories';

function validateTransactionInput(input: CreateTransactionInput): void {
  if (!input.stockSymbol.trim()) {
    throw new AppError('종목 코드를 입력해 주세요.');
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

export class ListTransactionsUseCase {
  constructor(private readonly repo: ITransactionRepository) {}

  execute(filters?: { stockId?: string; type?: string }) {
    return this.repo.list(filters);
  }
}

export class DeleteTransactionUseCase {
  constructor(private readonly repo: ITransactionRepository) {}

  execute(id: string) {
    return this.repo.delete(id);
  }
}

export class GetDashboardUseCase {
  constructor(private readonly repo: IPortfolioRepository) {}

  execute() {
    return this.repo.getDashboard();
  }
}

export class RefreshQuotesUseCase {
  constructor(private readonly repo: IPortfolioRepository) {}

  execute() {
    return this.repo.refreshQuotes();
  }
}
