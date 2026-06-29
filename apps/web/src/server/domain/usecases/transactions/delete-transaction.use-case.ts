import { ITransactionRepository } from '../../repositories';
import { EntityNotFoundError } from '../../errors/domain.errors';

export class DeleteTransactionUseCase {
  constructor(private readonly transactionRepo: ITransactionRepository) {}

  async execute(userId: string, txId: string): Promise<void> {
    const tx = await this.transactionRepo.findById(txId);
    if (!tx || tx.userId !== userId) {
      throw new EntityNotFoundError('Transaction not found');
    }
    await this.transactionRepo.delete(txId);
  }
}
