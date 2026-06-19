import { IAuthRepository } from '../../repositories';

export class LogoutUseCase {
  constructor(private readonly authRepo: IAuthRepository) {}

  execute() {
    return this.authRepo.logout();
  }
}
