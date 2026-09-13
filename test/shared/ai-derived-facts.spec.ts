import { describe, expect, it } from 'vitest';
import {
  buildPortfolioDerivedFacts,
  buildStockDerivedFacts,
  pickNewsTitlesForAi,
  priceTrendBandFromChange,
  rsiZoneFromValue,
} from '@sar/shared';

describe('AI derived facts', () => {
  it('maps price change to trend band', () => {
    expect(priceTrendBandFromChange(4)).toBe('strong_up');
    expect(priceTrendBandFromChange(0)).toBe('flat');
    expect(priceTrendBandFromChange(-4)).toBe('strong_down');
  });

  it('maps RSI to zone', () => {
    expect(rsiZoneFromValue(75)).toBe('overbought');
    expect(rsiZoneFromValue(25)).toBe('oversold');
    expect(rsiZoneFromValue(50)).toBe('neutral');
  });

  it('builds stock derived with event hint', () => {
    const d = buildStockDerivedFacts({
      change1d: 1.2,
      rsi14: 55,
      newsTone: 'bullish',
      eventKind: 'earnings_beat',
      eventDay: 'D0',
      ruleTag: 'momentum',
    });
    expect(d.eventHint).toBe('earnings_beat@D0');
    expect(d.ruleTag).toBe('momentum');
  });

  it('builds portfolio derived allocation drift', () => {
    const d = buildPortfolioDerivedFacts({
      totalValueKrw: 10_000_000,
      cashKrw: 1_000_000,
      cashUsd: 0,
      totalPnlKrw: 200_000,
      targetKrPercent: 50,
      targetUsPercent: 50,
      actualKrPercent: 70,
      actualUsPercent: 30,
      topHoldings: [{ weightPercent: 22 }],
    });
    expect(d.allocationDrift).toBe('kr_heavy');
    expect(d.pnlBand).toBe('profit');
    expect(d.topConcentrationPercent).toBe(22);
  });

  it('pickNewsTitlesForAi dedupes and caps titles only', () => {
    const titles = pickNewsTitlesForAi(
      ['Alpha', 'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta'],
      null,
    );
    expect(titles).toEqual(['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon']);
  });
});
