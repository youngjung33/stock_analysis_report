// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Market } from '@sar/shared';
import '@/i18n/config';
import { MarketSentimentSummarySection } from '@/presentation/components/MarketSentimentSummarySection';

vi.mock('@/presentation/hooks/useMarketIndices', () => ({
  useMarketIndices: vi.fn(),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import { useMarketIndices } from '@/presentation/hooks/useMarketIndices';

describe('MarketSentimentSummarySection', () => {
  it('renders KOSPI and NASDAQ index cards from indices API', () => {
    vi.mocked(useMarketIndices).mockReturnValue({
      data: {
        fetchedAt: '2026-01-01T00:00:00.000Z',
        indices: [
          {
            name: 'KOSPI',
            yahooSymbol: '^KS11',
            market: Market.KR,
            currentPrice: 2650,
            changePercent1d: 0.8,
          },
          {
            name: 'NASDAQ',
            yahooSymbol: '^IXIC',
            market: Market.US,
            currentPrice: 17800,
            changePercent1d: -0.3,
          },
        ],
      },
      isLoading: false,
      isError: false,
      isFetching: false,
      error: null,
      status: 'success',
      fetchStatus: 'idle',
      refetch: vi.fn(),
    } as never);

    render(<MarketSentimentSummarySection compact />);

    expect(screen.getByText('KOSPI')).toBeTruthy();
    expect(screen.getByText('NASDAQ')).toBeTruthy();
  });
});
