import { validateUsernameFormat } from '@sar/shared';
import { IUserRepository } from '../../repositories';

export interface CheckUsernameResult {
  available: boolean;
  message: string;
}

/** 아이디 형식·중복 여부 확인 */
export class CheckUsernameAvailabilityUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(username: string): Promise<CheckUsernameResult> {
    const formatError = validateUsernameFormat(username);
    if (formatError) {
      return { available: false, message: formatError };
    }

    const trimmed = username.trim();
    const existing = await this.userRepo.findByUsername(trimmed);
    if (existing) {
      return { available: false, message: '이미 사용 중인 아이디입니다.' };
    }

    return { available: true, message: '사용 가능한 아이디입니다.' };
  }
}
