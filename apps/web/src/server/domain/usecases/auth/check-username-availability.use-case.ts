import { AppErrorCode, AppSuccessCode, validateUsernameFormatCode, type AppErrorCode as AppErrorCodeType, type AppSuccessCode as AppSuccessCodeType } from '@sar/shared';
import { IUserRepository } from '../../repositories';

export interface CheckUsernameResult {
  available: boolean;
  code: AppSuccessCodeType | AppErrorCodeType;
}

/** 아이디 형식·중복 여부 확인 */
export class CheckUsernameAvailabilityUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(username: string): Promise<CheckUsernameResult> {
    const formatErrorCode = validateUsernameFormatCode(username);
    if (formatErrorCode) {
      return { available: false, code: formatErrorCode };
    }

    const trimmed = username.trim();
    const existing = await this.userRepo.findByUsername(trimmed);
    if (existing) {
      return { available: false, code: AppErrorCode.AUTH_USERNAME_TAKEN };
    }

    return { available: true, code: AppSuccessCode.AUTH_USERNAME_AVAILABLE };
  }
}
