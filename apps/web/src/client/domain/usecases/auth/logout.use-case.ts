import { IAuthRepository } from '../../repositories';

/** 로그아웃 API 호출 use case */
export class LogoutUseCase {
  constructor(private readonly authRepo: IAuthRepository) {}

  /** authRepo.logout 호출 */
  execute() {
    return this.authRepo.logout();
  }
}
