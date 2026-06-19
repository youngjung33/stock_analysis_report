import { ITransactionRepository } from '../../repositories';
import { NotFoundError } from '../../../http/errors';

export class DeleteTransactionUseCase {
  constructor(private readonly transactionRepo: ITransactionRepository) {}

  async execute(userId: string, txId: string): Promise<void> {
    const tx = await this.transactionRepo.findById(txId);
    if (!tx || tx.userId !== userId) {
      throw new NotFoundError('Transaction not found');
    }
    await this.transactionRepo.delete(txId);
  }
}
