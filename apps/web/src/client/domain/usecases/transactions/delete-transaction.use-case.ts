import { ITransactionRepository } from '../../repositories';

export class DeleteTransactionUseCase {
  constructor(private readonly repo: ITransactionRepository) {}

  execute(id: string) {
    return this.repo.delete(id);
  }
}
