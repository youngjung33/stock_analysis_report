import { vi, beforeEach, describe, expect, it } from 'vitest';
import { AI_STOCK_DAILY_LIMIT, AppErrorCode } from '@sar/shared';
import { CheckAiQuotaUseCase } from '@/server/domain/usecases/ai/check-ai-quota.use-case';

const mockCountToday = vi.fn();
const mockRecordUsage = vi.fn();

vi.mock('@/server/data/persistence/ai.repositories', () => ({
  PrismaAiUsageRepository: vi.fn().mockImplementation(() => ({
    countToday: mockCountToday,
    recordUsage: mockRecordUsage,
  })),
}));

describe('CheckAiQuotaUseCase', () => {
  beforeEach(() => {
    mockCountToday.mockReset();
    mockRecordUsage.mockReset();
    mockCountToday.mockResolvedValue(0);
    mockRecordUsage.mockResolvedValue(undefined);
  });

  it('allows when under stock daily limit', async () => {
    mockCountToday.mockResolvedValue(AI_STOCK_DAILY_LIMIT - 1);
    const uc = new CheckAiQuotaUseCase();
    await expect(uc.assertCanUse('user-1', 'stock')).resolves.toBeUndefined();
  });

  it('throws AI_QUOTA_EXCEEDED at stock limit', async () => {
    mockCountToday.mockResolvedValue(AI_STOCK_DAILY_LIMIT);
    const uc = new CheckAiQuotaUseCase();
    await expect(uc.assertCanUse('user-1', 'stock')).rejects.toMatchObject({
      code: AppErrorCode.AI_QUOTA_EXCEEDED,
    });
  });

  it('throws AI_QUOTA_EXCEEDED at portfolio limit (1/day)', async () => {
    mockCountToday.mockResolvedValue(1);
    const uc = new CheckAiQuotaUseCase();
    await expect(uc.assertCanUse('user-1', 'portfolio')).rejects.toMatchObject({
      code: AppErrorCode.AI_QUOTA_EXCEEDED,
    });
  });

  it('records usage after successful analysis', async () => {
    const uc = new CheckAiQuotaUseCase();
    await uc.recordUsage('user-1', 'stock');
    expect(mockRecordUsage).toHaveBeenCalledWith('user-1', 'stock');
  });
});
