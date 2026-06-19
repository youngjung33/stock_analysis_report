import { TransactionType } from '@sar/shared';
import { ITransactionRepository } from '../../repositories';

export class ListTransactionsUseCase {
  constructor(private readonly transactionRepo: ITransactionRepository) {}

  execute(userId: string, filters?: { stockId?: string; type?: TransactionType }) {
    return this.transactionRepo.findByUser(userId, filters);
  }
}
