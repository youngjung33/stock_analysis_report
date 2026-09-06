// @vitest-environment jsdom
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Market } from '@sar/shared';
import '@/i18n/config';
import { StockFocusSection } from '@/presentation/components/market-analysis/StockFocusSection';

const mockReport = {
  symbol: '005930',
  name: '삼성전자',
  market: Market.KR,
  currency: 'KRW',
  currentPrice: 70000,
  changePercent1d: 1.2,
  changePercent1w: 3.5,
  changePercent1mo: 5.1,
  fetchedAt: '2026-01-01T09:00:00.000Z',
  tag: 'momentum' as const,
  tagLabel: 'shared.tag.momentum',
  score: 0.8,
  scoreBreakdown: [
    {
      factor: 'trend',
      delta: 0.15,
      evidenceKey: 'shared.market.recommendation.evidence.trendUp',
      evidenceParams: {},
    },
  ],
  insights: [
    {
      id: 'story',
      category: 'stockStory' as const,
      categoryLabel: '한 줄 요약',
      tone: 'bullish' as const,
      title: '오늘 상승 흐름',
      summary: '지수 대비 강함',
      reasoning: '20일선 위에서 거래 중',
      evidence: [],
      evidenceItems: [],
      links: [],
      market: Market.KR,
    },
    {
      id: 'action',
      category: 'stockAction' as const,
      categoryLabel: '참고 의견',
      tone: 'neutral' as const,
      title: '관망',
      summary: '급하게 추격 매수하기보다 조정을 기다려 보세요.',
      reasoning: '차트·규칙表 기준 보수적 스탠스',
      evidence: ['68,600 KRW 이하 — 분할·조건부 매수 관심 구간'],
      evidenceItems: [
        { key: 'shared.market.stockFocus.evidence.stockActionBuyBelow', params: { price: '68,600', currency: 'KRW' } },
      ],
      links: [],
      market: Market.KR,
    },
  ],
};

vi.mock('@/presentation/hooks/useStockAnalysis', () => ({
  useStockAnalysis: vi.fn(),
}));

vi.mock('@/presentation/hooks/useErrorToast', () => ({
  useErrorToast: vi.fn(),
}));

vi.mock('@/presentation/shared/StockSearchField', () => ({
  StockSearchField: ({
    onSelect,
  }: {
    onSelect: (stock: { symbol: string; name: string; market: Market }) => void;
  }) => {
    React.useEffect(() => {
      onSelect({ symbol: '005930', name: '삼성전자', market: Market.KR });
    }, [onSelect]);
    return <div data-testid="stock-search-mock" />;
  },
}));

import { useStockAnalysis } from '@/presentation/hooks/useStockAnalysis';

describe('StockFocusSection', () => {
  beforeEach(() => {
    vi.mocked(useStockAnalysis).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    } as never);
  });

  it('renders section title and price-first guidance', () => {
    render(<StockFocusSection />);

    expect(screen.getByText('종목 집중 분석 — 왜 이 가격인가?')).toBeTruthy();
    expect(screen.getByText(/원칙: 가격·차트가 먼저/)).toBeTruthy();
    expect(screen.getByTestId('stock-search-mock')).toBeTruthy();
  });

  it('shows quote header and ordered insight cards when analysis loads', () => {
    vi.mocked(useStockAnalysis).mockReturnValue({
      data: mockReport,
      isLoading: false,
      isError: false,
    } as never);

    render(<StockFocusSection />);

    expect(screen.getByText(/삼성전자/)).toBeTruthy();
    expect(screen.getByText(/\(005930\)/)).toBeTruthy();
    expect(screen.getByText('참고만 — 투자 권유·매매 지시 아님')).toBeTruthy();
    expect(screen.getByText('참고 의견', { exact: true })).toBeTruthy();
    expect(screen.getByText('차트·시장 신호 (뉴스 제외)')).toBeTruthy();
    expect(screen.getByRole('link', { name: /차트 상세/ })).toBeTruthy();
  });

  it('shows loading message while fetching', () => {
    vi.mocked(useStockAnalysis).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as never);

    render(<StockFocusSection />);

    expect(screen.getByText('차트·시장·일정 분석 중… (최대 25초)')).toBeTruthy();
  });
});
