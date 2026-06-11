import { CreateTransactionInput } from '../../domain/models';
import { IPortfolioRepository, ITransactionRepository } from '../../domain/repositories';

export class CreateTransactionUseCase {
  constructor(private readonly repo: ITransactionRepository) {}

  execute(input: CreateTransactionInput) {
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
