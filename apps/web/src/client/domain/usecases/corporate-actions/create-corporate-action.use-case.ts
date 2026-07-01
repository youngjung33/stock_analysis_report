import { CreateCorporateActionInput, ICorporateActionRepository } from '../../repositories';

/** 기업행위 등록 use case */
export class CreateCorporateActionUseCase {
  constructor(private readonly corpActionRepo: ICorporateActionRepository) {}

  /** corpActionRepo.create — 등록된 기업행위 반환 */
  execute(input: CreateCorporateActionInput) {
    return this.corpActionRepo.create(input);
  }
}
