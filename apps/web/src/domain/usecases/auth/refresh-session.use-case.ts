import { IAuthRepository } from '../../repositories';

export class RefreshSessionUseCase {
  constructor(private readonly authRepo: IAuthRepository) {}

  execute() {
    return this.authRepo.refresh();
  }
}
