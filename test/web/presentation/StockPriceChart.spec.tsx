// @vitest-environment jsdom
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StockPriceChart } from '@/presentation/components/StockPriceChart';

const samplePoints = [
  { timestamp: '2024-01-01T09:00:00.000Z', close: 100 },
  { timestamp: '2024-01-02T09:00:00.000Z', close: 110 },
  { timestamp: '2024-01-03T09:00:00.000Z', close: 105 },
];

describe('StockPriceChart', () => {
  beforeEach(() => {
    Element.prototype.setPointerCapture = vi.fn();
    Element.prototype.releasePointerCapture = vi.fn();
    vi.spyOn(SVGSVGElement.prototype, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 640,
      height: 240,
      right: 640,
      bottom: 240,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);
  });

  it('shows empty state when fewer than 2 points', () => {
    render(
      <StockPriceChart points={[]} range="1mo" changePercent={null} currency="USD" />,
    );
    expect(screen.getByText('차트 데이터가 없습니다.')).toBeTruthy();
  });

  it('renders chart with aria label', () => {
    render(
      <StockPriceChart points={samplePoints} range="1mo" changePercent={5} currency="USD" />,
    );
    expect(screen.getByRole('img', { name: '종목 가격 차트' })).toBeTruthy();
  });

  it('renders y-axis labels from sample data', () => {
    render(
      <StockPriceChart points={samplePoints} range="1mo" changePercent={5} currency="USD" />,
    );
    expect(screen.getByText('$105')).toBeTruthy();
  });

  it('uses green stroke for positive change', () => {
    const { container } = render(
      <StockPriceChart points={samplePoints} range="1mo" changePercent={5} currency="USD" />,
    );
    const line = container.querySelector('path[stroke="#34d399"]');
    expect(line).toBeTruthy();
  });
});
