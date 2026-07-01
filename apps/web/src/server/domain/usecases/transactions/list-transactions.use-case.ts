import { TransactionType } from '@sar/shared';
import { ITransactionRepository } from '../../repositories';

/** 사용자 거래 목록 조회 use case */
export class ListTransactionsUseCase {
  constructor(private readonly transactionRepo: ITransactionRepository) {}

  /** userId 기준 거래 목록 — stockId·type 필터 선택 */
  execute(userId: string, filters?: { stockId?: string; type?: TransactionType }) {
    return this.transactionRepo.findByUser(userId, filters);
  }
}
