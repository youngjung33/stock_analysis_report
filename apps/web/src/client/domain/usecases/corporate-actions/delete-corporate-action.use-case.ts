import { ICorporateActionRepository } from '../../repositories';

/** 기업행위 삭제 use case */
export class DeleteCorporateActionUseCase {
  constructor(private readonly corpActionRepo: ICorporateActionRepository) {}

  execute(id: string) {
    return this.corpActionRepo.delete(id);
  }
}
