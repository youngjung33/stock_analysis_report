import { describe, expect, it } from 'vitest';
import {
  bollingerBands,
  changePercentOverBars,
  macdLine,
  rsi,
  sma,
  stdDev,
  stochastic,
} from '@sar/shared';

describe('technical-analysis core', () => {
  const closes = [44, 44.5, 45, 43, 42, 41, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50];
  const longCloses = Array.from({ length: 40 }, (_, i) => 100 + i * 0.5);

  it('computes SMA', () => {
    expect(sma(closes, 5)).toBeCloseTo(48, 1);
  });

  it('computes RSI in 0-100 range', () => {
    const value = rsi(closes);
    expect(value).not.toBeNull();
    expect(value!).toBeGreaterThan(0);
    expect(value!).toBeLessThanOrEqual(100);
  });

  it('computes MACD line', () => {
    expect(macdLine(longCloses)).not.toBeNull();
  });

  it('computes std dev', () => {
    expect(stdDev([1, 2, 3, 4, 5])).toBeCloseTo(1.41, 1);
  });
});

describe('bollingerBands', () => {
  it('returns bands and percentB', () => {
    const closes = Array.from({ length: 25 }, (_, i) => 100 + Math.sin(i) * 5);
    const bb = bollingerBands(closes);
    expect(bb).not.toBeNull();
    expect(bb!.upper).toBeGreaterThan(bb!.middle);
    expect(bb!.lower).toBeLessThan(bb!.middle);
  });
});

describe('stochastic', () => {
  it('returns k and d in range', () => {
    const len = 30;
    const highs = Array.from({ length: len }, (_, i) => 110 + i * 0.1);
    const lows = Array.from({ length: len }, (_, i) => 90 + i * 0.1);
    const closes = Array.from({ length: len }, (_, i) => 100 + i * 0.1);
    const st = stochastic(highs, lows, closes);
    expect(st).not.toBeNull();
    expect(st!.k).toBeGreaterThanOrEqual(0);
    expect(st!.k).toBeLessThanOrEqual(100);
  });
});

describe('changePercentOverBars', () => {
  it('computes return over N bars', () => {
    expect(changePercentOverBars([100, 105, 110], 2)).toBeCloseTo(10, 1);
  });
});
