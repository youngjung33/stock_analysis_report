import { CreateCorporateActionInput, ICorporateActionRepository } from '../../repositories';

/** 기업행위 등록 use case */
export class CreateCorporateActionUseCase {
  constructor(private readonly corpActionRepo: ICorporateActionRepository) {}

  execute(input: CreateCorporateActionInput) {
    return this.corpActionRepo.create(input);
  }
}
