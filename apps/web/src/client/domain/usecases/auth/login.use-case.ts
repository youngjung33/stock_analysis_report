import { validateLoginInput } from '@sar/shared';
import { AppError } from '../../errors/app-error';
import { IAuthRepository } from '../../repositories';

/** 로그인 API 호출 use case */
export class LoginUseCase {
  constructor(private readonly authRepo: IAuthRepository) {}

  execute(username: string, password: string) {
    const validationError = validateLoginInput(username, password);
    if (validationError) {
      throw new AppError('', validationError);
    }
    return this.authRepo.login(username, password);
  }
}
