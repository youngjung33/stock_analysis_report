import { describe, expect, it, vi } from 'vitest';
import { AxiosError } from 'axios';
import { AppErrorCode } from '@sar/shared';
import { ApiAiRepository } from '@/client/data/repositories/ai.repository';
import { AppError } from '@/client/domain/errors/app-error';

vi.mock('@/client/data/api/client', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { apiClient } from '@/client/data/api/client';

describe('ApiAiRepository', () => {
  it('returns stock insight payload on success', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { enabled: true, insight: { sections: [] } },
    });
    const repo = new ApiAiRepository();
    const result = await repo.fetchStockInsight({
      symbol: '005930',
      name: 'Samsung',
      market: 'KR' as never,
      locale: 'ko',
    });
    expect(result.enabled).toBe(true);
  });

  it('maps API error code from stock insight failure', async () => {
    const axiosError = new AxiosError('bad');
    axiosError.response = {
      status: 400,
      data: { code: AppErrorCode.AI_QUOTA_EXCEEDED, message: 'quota' },
      statusText: 'Bad Request',
      headers: {},
      config: {} as never,
    };
    vi.mocked(apiClient.post).mockRejectedValue(axiosError);

    const repo = new ApiAiRepository();
    await expect(
      repo.fetchStockInsight({
        symbol: '005930',
        name: 'Samsung',
        market: 'KR' as never,
        locale: 'ko',
      }),
    ).rejects.toMatchObject({ code: AppErrorCode.AI_QUOTA_EXCEEDED });
  });

  it('falls back to AI_PROVIDER_ERROR when response has no code', async () => {
    const axiosError = new AxiosError('bad');
    axiosError.response = {
      status: 500,
      data: {},
      statusText: 'Error',
      headers: {},
      config: {} as never,
    };
    vi.mocked(apiClient.post).mockRejectedValue(axiosError);

    const repo = new ApiAiRepository();
    await expect(repo.fetchPortfolioInsight('ko')).rejects.toBeInstanceOf(AppError);
    await expect(repo.fetchPortfolioInsight('ko')).rejects.toMatchObject({
      code: AppErrorCode.INTERNAL,
    });
  });
});
