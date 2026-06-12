import { Injectable, NotFoundException } from '@nestjs/common';
import { ITransactionRepository } from '../../domain/repositories';

@Injectable()
export class DeleteTransactionUseCase {
  constructor(private readonly transactionRepo: ITransactionRepository) {}

  async execute(userId: string, transactionId: string): Promise<void> {
    const tx = await this.transactionRepo.findById(transactionId);
    if (!tx || tx.userId !== userId) {
      throw new NotFoundException('Transaction not found');
    }
    await this.transactionRepo.delete(transactionId);
  }
}
