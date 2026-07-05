import { IAuthRepository } from '../../repositories';

/** 아이디 중복·형식 확인 API */
export class CheckUsernameAvailabilityUseCase {
  constructor(private readonly authRepo: IAuthRepository) {}

  execute(username: string) {
    return this.authRepo.checkUsernameAvailability(username);
  }
}
