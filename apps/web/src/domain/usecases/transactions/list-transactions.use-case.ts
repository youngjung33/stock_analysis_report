import { ITransactionRepository } from '../../repositories';

export class ListTransactionsUseCase {
  constructor(private readonly repo: ITransactionRepository) {}

  execute(filters?: { stockId?: string; type?: string }) {
    return this.repo.list(filters);
  }
}
