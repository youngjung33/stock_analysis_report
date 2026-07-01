import { ITransactionRepository } from '../../repositories';

/** 거래 삭제 API 호출 use case */
export class DeleteTransactionUseCase {
  constructor(private readonly repo: ITransactionRepository) {}

  /** id 기준 repo.delete */
  execute(id: string) {
    return this.repo.delete(id);
  }
}
