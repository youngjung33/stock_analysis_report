// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AppErrorCode, Market } from '@sar/shared';
import { AppError } from '@/client/domain/errors/app-error';
import '@/i18n/config';
import { AiStockInsightPanel } from '@/presentation/features/ai/AiStockInsightPanel';

const { execute, useErrorToast } = vi.hoisted(() => ({
  execute: vi.fn(),
  useErrorToast: vi.fn(),
}));

vi.mock('@/presentation/hooks/useAuth', () => ({
  useAuth: () => ({ isGuest: false }),
}));

vi.mock('@/presentation/hooks/useServices', () => ({
  useServices: () => ({
    fetchStockAiInsightUseCase: { execute },
  }),
}));

vi.mock('@/presentation/hooks/useErrorToast', () => ({
  useErrorToast,
}));

vi.mock('@/presentation/features/ai/AiInsightSections', () => ({
  AiInsightSections: () => <div data-testid="ai-sections" />,
}));

describe('AiStockInsightPanel', () => {
  beforeEach(() => {
    execute.mockReset();
    useErrorToast.mockReset();
  });

  const selected = {
    symbol: '005930',
    name: '삼성전자',
    market: Market.KR,
    yahooSymbol: '005930.KS',
  };

  it('shows inline notice when AI is disabled (no error toast)', async () => {
    execute.mockResolvedValue({ enabled: false, insight: null });

    render(<AiStockInsightPanel selected={selected} />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('AI 해석 기능이 비활성화되어 있습니다.')).toBeTruthy();
    });
    expect(useErrorToast).toHaveBeenCalledWith(false, expect.any(String));
  });

  it('triggers error toast on fetch failure without duplicate inline alert', async () => {
    execute.mockRejectedValue(new AppError('x', AppErrorCode.AI_PROVIDER_ERROR));

    render(<AiStockInsightPanel selected={selected} />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(useErrorToast).toHaveBeenCalledWith(true, expect.any(String));
    });
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
