import { AppError } from '../../errors/app-error';
import { IAuthRepository } from '../../repositories';

/** 로그인 API 호출 use case */
export class LoginUseCase {
  constructor(private readonly authRepo: IAuthRepository) {}

  /** 입력 검증 후 authRepo.login — accessToken 등 반환 */
  execute(username: string, password: string) {
    if (!username.trim() || !password.trim()) {
      throw new AppError('아이디와 비밀번호를 입력해 주세요.');
    }
    return this.authRepo.login(username, password);
  }
}
