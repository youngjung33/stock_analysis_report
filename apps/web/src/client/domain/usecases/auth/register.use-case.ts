import { getRegisterValidationError, RegisterInput } from '@sar/shared';
import { AppError } from '../../errors/app-error';
import { IAuthRepository } from '../../repositories';

/** 회원가입 API 호출 use case */
export class RegisterUseCase {
  constructor(private readonly authRepo: IAuthRepository) {}

  execute(input: RegisterInput) {
    const validationError = getRegisterValidationError(input);
    if (validationError) {
      throw new AppError(validationError.message, validationError.code);
    }
    return this.authRepo.register(input);
  }
}
