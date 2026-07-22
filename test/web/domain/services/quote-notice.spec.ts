import type { TFunction } from 'i18next';
import { describe, expect, it } from 'vitest';
import { Market } from '@sar/shared';
import ko from '@/i18n/locales/ko.json';
import { buildQuoteRefreshNotice } from '@/client/domain/services/quote-notice';
import { RefreshQuoteResult } from '@/client/domain/models';

const t = ((key: string, params?: Record<string, string | number>) => {
  const parts = key.split('.');
  let value: unknown = ko;
  for (const part of parts) {
    value = (value as Record<string, unknown>)?.[part];
  }
  if (typeof value !== 'string') return key;
  if (!params) return value;
  return Object.entries(params).reduce(
    (acc, [k, v]) => acc.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v)),
    value,
  );
}) as TFunction;

describe('buildQuoteRefreshNotice', () => {
  it('returns success notice when all quotes succeed', () => {
    const result: RefreshQuoteResult = {
      updated: 2,
      succeeded: [
        { stockId: '1', symbol: '005930', market: Market.KR },
        { stockId: '2', symbol: '035720', market: Market.KR },
      ],
      failed: [],
    };

    const notice = buildQuoteRefreshNotice(result, t);
    expect(notice?.variant).toBe('success');
    expect(notice?.lines[0]).toContain('한국 2건 갱신');
  });

  it('returns warning when some quotes fail due to missing API key', () => {
    const result: RefreshQuoteResult = {
      updated: 1,
      succeeded: [{ stockId: '1', symbol: '005930', market: Market.KR }],
      failed: [
        {
          stockId: '2',
          symbol: 'AAPL',
          market: Market.US,
          reason: 'FINNHUB_API_KEY가 설정되지 않았습니다.',
          reasonCode: 'not_configured',
        },
      ],
    };

    const notice = buildQuoteRefreshNotice(result, t);
    expect(notice?.variant).toBe('warning');
    expect(notice?.lines.some((line) => line.includes('AAPL'))).toBe(true);
    expect(notice?.lines.some((line) => line.includes('FINNHUB_API_KEY'))).toBe(true);
  });

  it('returns error when nothing was updated', () => {
    const result: RefreshQuoteResult = {
      updated: 0,
      succeeded: [],
      failed: [
        {
          stockId: '2',
          symbol: 'AAPL',
          market: Market.US,
          reason: 'FINNHUB_API_KEY가 설정되지 않았습니다.',
          reasonCode: 'not_configured',
        },
      ],
    };

    const notice = buildQuoteRefreshNotice(result, t);
    expect(notice?.variant).toBe('error');
  });
});
