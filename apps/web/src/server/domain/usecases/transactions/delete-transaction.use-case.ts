import { ITransactionRepository } from '../../repositories';
import { EntityNotFoundError } from '../../errors/domain.errors';

/** 거래 삭제 use case */
export class DeleteTransactionUseCase {
  constructor(private readonly transactionRepo: ITransactionRepository) {}

  /** userId 소유 거래만 삭제 — 없으면 EntityNotFoundError */
  async execute(userId: string, txId: string): Promise<void> {
    const tx = await this.transactionRepo.findById(txId);
    if (!tx || tx.userId !== userId) {
      throw new EntityNotFoundError('Transaction not found');
    }
    await this.transactionRepo.delete(txId);
  }
}
