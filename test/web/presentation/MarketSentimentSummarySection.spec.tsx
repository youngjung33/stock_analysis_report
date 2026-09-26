// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Market } from '@sar/shared';
import '@/i18n/config';
import { MarketSentimentSummarySection } from '@/presentation/components/MarketSentimentSummarySection';

vi.mock('@/presentation/hooks/useMarketSentimentSummary', () => ({
  useMarketSentimentSummary: vi.fn(),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import { useMarketSentimentSummary } from '@/presentation/hooks/useMarketSentimentSummary';

describe('MarketSentimentSummarySection', () => {
  it('renders KOSPI and NASDAQ index cards from sentiment summary API', () => {
    vi.mocked(useMarketSentimentSummary).mockReturnValue({
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
        insights: {
          kr: {
            market: Market.KR,
            label: 'bull',
            avgChangePercent: 0.8,
            upCount: 0,
            downCount: 0,
            flatCount: 0,
            headline: '',
            description: '',
          },
          us: {
            market: Market.US,
            label: 'bear',
            avgChangePercent: -0.3,
            upCount: 0,
            downCount: 0,
            flatCount: 0,
            headline: '',
            description: '',
          },
          recommendations: [],
          regimes: [],
        },
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
