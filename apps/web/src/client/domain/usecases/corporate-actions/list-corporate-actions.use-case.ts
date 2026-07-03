import { ICorporateActionRepository } from '../../repositories';

/** 기업행위 목록 조회 use case */
export class ListCorporateActionsUseCase {
  constructor(private readonly corpActionRepo: ICorporateActionRepository) {}

  execute() {
    return this.corpActionRepo.list();
  }
}
