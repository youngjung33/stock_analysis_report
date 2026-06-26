import { describe, expect, it } from 'vitest';
import { Market } from '@sar/shared';
import {
  dedupeCatalogEntries,
  parseKrxBaseInfoRows,
  parseNasdaqListedTxt,
  parseOtherListedTxt,
} from '@sar/shared';

const NASDAQ_SAMPLE = `Symbol|Security Name|Market Category|Test Issue|Financial Status|Round Lot Size|ETF|NextShares
AAPL|Apple Inc. Common Stock|Q|N|N|100|N|N
ZZZZ|Test Issue Co|Q|Y|N|100|N|N
SPY|SPDR S&P 500|G|N|N|100|Y|N
`;

const OTHER_SAMPLE = `ACT Symbol|Security Name|Exchange|CQS Symbol|ETF|Round Lot Size|Test Issue|NASDAQ Symbol
A|Agilent Technologies, Inc. Common Stock|N|A|N|100|N|A
AAA|Some ETF|P|AAA|Y|100|N|AAA
`;

describe('parseNasdaqListedTxt', () => {
  it('parses equities and skips test/ETF rows', () => {
    const rows = parseNasdaqListedTxt(NASDAQ_SAMPLE);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      symbol: 'AAPL',
      name: 'Apple Inc. Common Stock',
      market: Market.US,
      board: 'NASDAQ',
    });
  });
});

describe('parseOtherListedTxt', () => {
  it('parses NYSE stocks and skips ETF', () => {
    const rows = parseOtherListedTxt(OTHER_SAMPLE);
    expect(rows).toHaveLength(1);
    expect(rows[0].symbol).toBe('A');
    expect(rows[0].board).toBe('NYSE');
  });
});

describe('parseKrxBaseInfoRows', () => {
  it('maps KRX rows to catalog entries', () => {
    const rows = parseKrxBaseInfoRows(
      [{ ISU_SRT_CD: '005930', ISU_NM: '삼성전자' }],
      'KOSPI',
    );
    expect(rows[0]).toMatchObject({
      symbol: '005930',
      name: '삼성전자',
      market: Market.KR,
      board: 'KOSPI',
      yahooSymbol: '005930.KS',
    });
  });
});

describe('dedupeCatalogEntries', () => {
  it('removes duplicate symbol+market', () => {
    const rows = dedupeCatalogEntries([
      { symbol: 'AAPL', name: 'A', market: Market.US, board: 'NASDAQ', yahooSymbol: 'AAPL' },
      { symbol: 'AAPL', name: 'B', market: Market.US, board: 'NASDAQ', yahooSymbol: 'AAPL' },
    ]);
    expect(rows).toHaveLength(1);
  });
});
