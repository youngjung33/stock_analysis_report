import { AppErrorCode, validateLoginInput } from '@sar/shared';
import { IUserRepository } from '../../repositories';
import { IPasswordHasher } from '../../repositories';
import { AuthenticationError, ValidationError } from '../../errors/domain.errors';
import { AuthSessionService } from '../../services/auth-session.service';

export interface LoginInput {
  username: string;
  password: string;
}

/** 아이디·비밀번호 로그인 — OAuth 전용 계정은 거부 */
export class LoginUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly authSession: AuthSessionService,
  ) {}

  async execute(input: LoginInput) {
    const validationError = validateLoginInput(input.username, input.password);
    if (validationError) {
      throw new ValidationError(AppErrorCode.AUTH_LOGIN_REQUIRED, validationError);
    }

    const user = await this.userRepo.findByUsername(input.username.trim());
    if (!user) {
      throw new AuthenticationError(AppErrorCode.AUTH_INVALID_CREDENTIALS);
    }

    if (!user.passwordHash) {
      throw new AuthenticationError(AppErrorCode.AUTH_SOCIAL_ONLY);
    }

    const valid = await this.passwordHasher.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new AuthenticationError(AppErrorCode.AUTH_INVALID_CREDENTIALS);
    }

    return this.authSession.issueForUser(user);
  }
}
