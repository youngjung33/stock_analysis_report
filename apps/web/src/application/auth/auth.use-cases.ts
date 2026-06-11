import { IAuthRepository } from '../../domain/repositories';

export class LoginUseCase {
  constructor(private readonly authRepo: IAuthRepository) {}

  execute(username: string, password: string) {
    return this.authRepo.login(username, password);
  }
}

export class RefreshSessionUseCase {
  constructor(private readonly authRepo: IAuthRepository) {}

  execute() {
    return this.authRepo.refresh();
  }
}

export class LogoutUseCase {
  constructor(private readonly authRepo: IAuthRepository) {}

  execute() {
    return this.authRepo.logout();
  }
}
