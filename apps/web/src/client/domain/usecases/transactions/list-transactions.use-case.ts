import { ITransactionRepository } from '../../repositories';

/** 거래 목록 API 조회 use case */
export class ListTransactionsUseCase {
  constructor(private readonly repo: ITransactionRepository) {}

  /** stockId·type 필터로 repo.list */
  execute(filters?: { stockId?: string; type?: string }) {
    return this.repo.list(filters);
  }
}
