import { AppError } from '../../errors/app-error';
import { IAuthRepository } from '../../repositories';

export class LoginUseCase {
  constructor(private readonly authRepo: IAuthRepository) {}

  execute(username: string, password: string) {
    if (!username.trim() || !password.trim()) {
      throw new AppError('아이디와 비밀번호를 입력해 주세요.');
    }
    return this.authRepo.login(username, password);
  }
}
