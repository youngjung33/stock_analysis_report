import { describe, expect, it } from 'vitest';
import { CheckUsernameAvailabilityUseCase } from '@server/domain/usecases/auth/check-username-availability.use-case';
import { AppErrorCode, AppSuccessCode } from '@sar/shared';
import { createMockUser, createMockUserRepo } from '../../mocks/repositories.mock';

describe('CheckUsernameAvailabilityUseCase', () => {
  it('returns available for new username', async () => {
    const userRepo = createMockUserRepo();
    userRepo.findByUsername.mockResolvedValue(null);

    const useCase = new CheckUsernameAvailabilityUseCase(userRepo);
    const result = await useCase.execute('new_user');

    expect(result.available).toBe(true);
    expect(result.code).toBe(AppSuccessCode.AUTH_USERNAME_AVAILABLE);
  });

  it('returns unavailable for duplicate username', async () => {
    const userRepo = createMockUserRepo();
    userRepo.findByUsername.mockResolvedValue(createMockUser());

    const useCase = new CheckUsernameAvailabilityUseCase(userRepo);
    const result = await useCase.execute('admin');

    expect(result.available).toBe(false);
    expect(result.code).toBe(AppErrorCode.AUTH_USERNAME_TAKEN);
  });

  it('returns format error code for invalid username', async () => {
    const useCase = new CheckUsernameAvailabilityUseCase(createMockUserRepo());
    const result = await useCase.execute('ab');

    expect(result.available).toBe(false);
    expect(result.code).toBe(AppErrorCode.AUTH_USERNAME_INVALID);
  });
});
