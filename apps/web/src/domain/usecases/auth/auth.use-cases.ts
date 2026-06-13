import { AppError } from '../../errors/app-error';
import { IAuthRepository } from '../../repositories';

export class LoginUseCase {
  constructor(private readonly authRepo: IAuthRepository) {}

  execute(username: string, password: string) {
    if (!username.trim() || !password.trim()) {
      throw new AppError('?ÑÏù¥?îÏ? ÎπÑÎ?Î≤àÌò∏Î•??ÖÎ†•??Ï£ºÏÑ∏??');
    }
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
