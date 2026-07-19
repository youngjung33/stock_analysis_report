import { describe, expect, it } from 'vitest';
import { Market, TransactionType } from '../../packages/shared/src/enums';
import { extractRealizedEvents, filterEventsByYear } from '../../packages/shared/src/realized-events';
import {
  CAPITAL_GAINS_BASIC_DEDUCTION_KRW,
  DEFAULT_KOREAN_TAX_PROFILE,
  estimateKoreanTax,
  FINANCIAL_INCOME_THRESHOLD_KRW,
  FOREIGN_CAPITAL_GAINS_RATE,
  resolveApplicableTaxRules,
} from '../../packages/shared/src/korean-tax';

describe('extractRealizedEvents', () => {
  it('records sell gain with average cost', () => {
    const { sells } = extractRealizedEvents(
      [
        { type: TransactionType.BUY, quantity: 10, price: 100, tradedAt: '2026-01-01' },
        { type: TransactionType.SELL, quantity: 4, price: 150, tradedAt: '2026-06-01' },
      ],
      [],
    );
    expect(sells).toHaveLength(1);
    expect(sells[0].gain).toBe(200);
    expect(sells[0].proceeds).toBe(600);
  });

  it('collects dividend corporate actions', () => {
    const { dividends } = extractRealizedEvents(
      [{ type: TransactionType.BUY, quantity: 10, price: 100, tradedAt: '2026-01-01' }],
      [{ type: 'DIVIDEND', effectiveAt: '2026-03-01', cashAmount: 50_000 }],
    );
    expect(dividends).toHaveLength(1);
    expect(dividends[0].amount).toBe(50_000);
  });
});

describe('filterEventsByYear', () => {
  it('filters by calendar year', () => {
    const sells = filterEventsByYear(
      [{ tradedAt: '2025-12-31', quantity: 1, price: 1, proceeds: 1, gain: 0, averageCostAtSell: 1 }],
      2026,
    );
    expect(sells).toHaveLength(0);
  });
});

describe('resolveApplicableTaxRules', () => {
  it('marks domestic capital gains exempt for general investor', () => {
    const rules = resolveApplicableTaxRules({
      ...DEFAULT_KOREAN_TAX_PROFILE,
      isMajorShareholder: false,
      investsDomestic: true,
    });
    const general = rules.find((r) => r.ruleId === 'kr-capital-general');
    expect(general?.status).toBe('exempt');
  });

  it('marks major shareholder capital gains as applies', () => {
    const rules = resolveApplicableTaxRules({
      ...DEFAULT_KOREAN_TAX_PROFILE,
      isMajorShareholder: true,
      investsDomestic: true,
    });
    const major = rules.find((r) => r.ruleId === 'kr-capital-major');
    expect(major?.status).toBe('applies');
  });

  it('skips foreign rules when not investing abroad', () => {
    const rules = resolveApplicableTaxRules({
      ...DEFAULT_KOREAN_TAX_PROFILE,
      investsForeign: false,
    });
    expect(rules.find((r) => r.ruleId === 'us-capital')?.status).toBe('not_applicable');
  });
});

describe('estimateKoreanTax', () => {
  it('exempts domestic capital gains for general investor', () => {
    const result = estimateKoreanTax(
      [
        {
          symbol: '005930',
          market: Market.KR,
          currency: 'KRW',
          transactions: [
            { type: TransactionType.BUY, quantity: 10, price: 100_000, tradedAt: '2026-01-01' },
            { type: TransactionType.SELL, quantity: 10, price: 120_000, tradedAt: '2026-06-01' },
          ],
          corporateActions: [],
        },
      ],
      { ...DEFAULT_KOREAN_TAX_PROFILE, taxYear: 2026, isMajorShareholder: false },
      null,
    );
    expect(result.domesticCapitalGainTaxKrw).toBe(0);
    expect(result.domesticCapitalGainKrw).toBe(200_000);
    expect(result.domesticSecuritiesTaxKrw).toBeGreaterThan(0);
  });

  it('taxes foreign capital gains after basic deduction', () => {
    const totalGainKrw = CAPITAL_GAINS_BASIC_DEDUCTION_KRW + 1_000_000;
    const usdKrw = 1300;
    const gainPerShareUsd = totalGainKrw / usdKrw / 10;
    const result = estimateKoreanTax(
      [
        {
          symbol: 'AAPL',
          market: Market.US,
          currency: 'USD',
          transactions: [
            { type: TransactionType.BUY, quantity: 10, price: 100, tradedAt: '2026-01-01' },
            {
              type: TransactionType.SELL,
              quantity: 10,
              price: 100 + gainPerShareUsd,
              tradedAt: '2026-06-01',
            },
          ],
          corporateActions: [],
        },
      ],
      { ...DEFAULT_KOREAN_TAX_PROFILE, taxYear: 2026 },
      usdKrw,
    );
    expect(result.foreignCapitalGainTaxableKrw).toBe(1_000_000);
    expect(result.foreignCapitalGainTaxKrw).toBe(Math.round(1_000_000 * FOREIGN_CAPITAL_GAINS_RATE));
  });

  it('applies comprehensive tax when financial income exceeds threshold', () => {
    const result = estimateKoreanTax(
      [
        {
          symbol: '005930',
          market: Market.KR,
          currency: 'KRW',
          transactions: [{ type: TransactionType.BUY, quantity: 100, price: 100_000, tradedAt: '2026-01-01' }],
          corporateActions: [
            {
              type: 'DIVIDEND',
              effectiveAt: '2026-04-01',
              cashAmount: FINANCIAL_INCOME_THRESHOLD_KRW + 1_000_000,
            },
          ],
        },
      ],
      {
        ...DEFAULT_KOREAN_TAX_PROFILE,
        taxYear: 2026,
        otherFinancialIncomeKrw: 0,
        otherIncomeBracketId: '50m_88m',
      },
      null,
    );
    expect(result.requiresComprehensiveTax).toBe(true);
    expect(result.comprehensiveTaxKrw).toBeGreaterThan(0);
    expect(result.separationDividendTaxKrw).toBe(0);
  });

  it('withholds domestic dividend at 15.4% under threshold', () => {
    const dividend = 1_000_000;
    const result = estimateKoreanTax(
      [
        {
          symbol: '005930',
          market: Market.KR,
          currency: 'KRW',
          transactions: [{ type: TransactionType.BUY, quantity: 10, price: 100_000, tradedAt: '2026-01-01' }],
          corporateActions: [{ type: 'DIVIDEND', effectiveAt: '2026-04-01', cashAmount: dividend }],
        },
      ],
      { ...DEFAULT_KOREAN_TAX_PROFILE, taxYear: 2026 },
      null,
    );
    expect(result.requiresComprehensiveTax).toBe(false);
    expect(result.domesticDividendWithheldKrw).toBe(Math.round(dividend * 0.154));
  });
});
