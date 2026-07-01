import { IAuthRepository } from '../../repositories';

/** 세션 refresh API 호출 use case */
export class RefreshSessionUseCase {
  constructor(private readonly authRepo: IAuthRepository) {}

  /** authRepo.refresh — 새 accessToken 등 반환 */
  execute() {
    return this.authRepo.refresh();
  }
}
