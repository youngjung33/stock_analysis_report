// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HeavyRequestLoadingMessage } from '@/presentation/components/HeavyRequestLoadingMessage';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, number>) => {
      if (key === 'market.heavyLoading.titleStock') return '분석 중';
      if (key === 'market.heavyLoading.titleMarket') return '시장 분석 중';
      if (key === 'market.heavyLoading.hintSeconds' && params) {
        return `약 ${params.min}~${params.max}초`;
      }
      if (key === 'market.heavyLoading.hintStillWorking') return '조금 더';
      if (key === 'market.heavyLoading.hintAlmostDone') return '곧 완료';
      if (key === 'market.heavyLoading.hintMinutes' && params) {
        return `약 ${params.min}~${params.max}분`;
      }
      return key;
    },
  }),
}));

describe('HeavyRequestLoadingMessage', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows progress bar and percent without server jargon', () => {
    vi.useFakeTimers();
    render(<HeavyRequestLoadingMessage active kind="stockFocus" />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toBeTruthy();
    expect(bar.getAttribute('aria-valuenow')).toBeTruthy();
    expect(screen.getByText('분석 중')).toBeTruthy();
    expect(screen.queryByText(/서버|클라이언트|Finnhub/i)).toBeNull();
  });

  it('increases displayed percent over time', async () => {
    vi.useFakeTimers();
    render(<HeavyRequestLoadingMessage active kind="stockFocus" />);
    const initial = Number(screen.getByRole('progressbar').getAttribute('aria-valuenow'));
    await vi.advanceTimersByTimeAsync(8000);
    const later = Number(screen.getByRole('progressbar').getAttribute('aria-valuenow'));
    expect(later).toBeGreaterThan(initial);
  });
});
