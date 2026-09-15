import { vi, beforeEach, describe, expect, it } from 'vitest';
import { AppErrorCode } from '@sar/shared';
import { CheckAiQuotaUseCase } from '@/server/domain/usecases/ai/check-ai-quota.use-case';

const mockReserveUsage = vi.fn();
const mockDeleteUsage = vi.fn();

vi.mock('@/server/data/persistence/ai.repositories', () => ({
  PrismaAiUsageRepository: vi.fn().mockImplementation(() => ({
    reserveUsage: mockReserveUsage,
    deleteUsage: mockDeleteUsage,
  })),
}));

describe('CheckAiQuotaUseCase', () => {
  beforeEach(() => {
    mockReserveUsage.mockReset();
    mockDeleteUsage.mockReset();
    mockReserveUsage.mockResolvedValue('usage-1');
    mockDeleteUsage.mockResolvedValue(undefined);
  });

  it('reserves usage atomically when under stock daily limit', async () => {
    mockReserveUsage.mockResolvedValue('usage-abc');
    const uc = new CheckAiQuotaUseCase();
    await expect(uc.reserveUsage('user-1', 'stock')).resolves.toBe('usage-abc');
  });

  it('throws AI_QUOTA_EXCEEDED at stock limit', async () => {
    mockReserveUsage.mockResolvedValue(null);
    const uc = new CheckAiQuotaUseCase();
    await expect(uc.reserveUsage('user-1', 'stock')).rejects.toMatchObject({
      code: AppErrorCode.AI_QUOTA_EXCEEDED,
    });
  });

  it('throws AI_QUOTA_EXCEEDED at portfolio limit (1/day)', async () => {
    mockReserveUsage.mockResolvedValue(null);
    const uc = new CheckAiQuotaUseCase();
    await expect(uc.reserveUsage('user-1', 'portfolio')).rejects.toMatchObject({
      code: AppErrorCode.AI_QUOTA_EXCEEDED,
    });
  });

  it('releases reserved usage on failure', async () => {
    const uc = new CheckAiQuotaUseCase();
    await uc.releaseUsage('usage-abc');
    expect(mockDeleteUsage).toHaveBeenCalledWith('usage-abc');
  });
});
