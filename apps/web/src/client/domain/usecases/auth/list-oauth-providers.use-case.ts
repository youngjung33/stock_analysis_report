import { IAuthRepository } from '../../repositories';

/** 설정된 OAuth 제공자 목록 조회 */
export class ListOAuthProvidersUseCase {
  constructor(private readonly authRepo: IAuthRepository) {}

  execute() {
    return this.authRepo.listOAuthProviders();
  }
}
