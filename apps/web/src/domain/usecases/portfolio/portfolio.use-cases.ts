import { AppError } from '../../errors/app-error';
import { CreateTransactionInput } from '../../models';
import { IPortfolioRepository, ITransactionRepository } from '../../repositories';

function validateTransactionInput(input: CreateTransactionInput): void {
  if (!input.stockSymbol.trim()) {
    throw new AppError('종목 코드�??�력??주세??');
  }
  if (input.quantity <= 0) {
    throw new AppError('?�량?� 0보다 커야 ?�니??');
  }
  if (input.price <= 0) {
    throw new AppError('?��???0보다 커야 ?�니??');
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
