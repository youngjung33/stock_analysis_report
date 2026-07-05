import { CheckUsernameAvailabilityUseCase } from '@server/domain/usecases/auth/check-username-availability.use-case';
import { createMockUser, createMockUserRepo } from '../../mocks/repositories.mock';

describe('CheckUsernameAvailabilityUseCase', () => {
  it('returns available for new username', async () => {
    const userRepo = createMockUserRepo();
    userRepo.findByUsername.mockResolvedValue(null);

    const useCase = new CheckUsernameAvailabilityUseCase(userRepo);
    const result = await useCase.execute('new_user');

    expect(result.available).toBe(true);
    expect(result.message).toContain('사용 가능');
  });

  it('returns unavailable for duplicate username', async () => {
    const userRepo = createMockUserRepo();
    userRepo.findByUsername.mockResolvedValue(createMockUser());

    const useCase = new CheckUsernameAvailabilityUseCase(userRepo);
    const result = await useCase.execute('admin');

    expect(result.available).toBe(false);
    expect(result.message).toContain('이미 사용');
  });

  it('returns format error for invalid username', async () => {
    const useCase = new CheckUsernameAvailabilityUseCase(createMockUserRepo());
    const result = await useCase.execute('ab');

    expect(result.available).toBe(false);
    expect(result.message).toContain('아이디');
  });
});
