import type { TFunction } from 'i18next';
import { describe, expect, it } from 'vitest';
import ko from '@/i18n/locales/ko.json';
import en from '@/i18n/locales/en.json';
import { translateAnalysisInsight } from '@/i18n/translate-shared';

function collectKeys(value: unknown, prefix = ''): string[] {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return prefix ? [prefix] : [];
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (nested !== null && typeof nested === 'object' && !Array.isArray(nested)) {
      return collectKeys(nested, path);
    }
    return [path];
  });
}

function makeT(bundle: typeof ko): TFunction {
  return ((key: string, params?: Record<string, string>) => {
    const parts = key.split('.');
    let value: unknown = bundle;
    for (const part of parts) {
      value = (value as Record<string, unknown>)?.[part];
    }
    if (typeof value !== 'string') return String(params?.defaultValue ?? key);
    if (!params) return value;
    return Object.entries(params).reduce(
      (acc, [k, v]) => acc.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v)),
      value,
    );
  }) as TFunction;
}

describe('stock focus i18n', () => {
  it('ko and en have matching stockFocus insight keys', () => {
    const koKeys = collectKeys(ko.shared.market.insights.stockFocus).sort();
    const enKeys = collectKeys(en.shared.market.insights.stockFocus).sort();
    expect(koKeys).toEqual(enKeys);
  });

  it('ko and en have matching narrativeDivergence keys', () => {
    const koKeys = Object.keys(ko.shared.market.narrativeDivergence).sort();
    const enKeys = Object.keys(en.shared.market.narrativeDivergence).sort();
    expect(koKeys).toEqual(enKeys);
  });

  it('ko and en have matching market.stockFocus shell keys', () => {
    const shellKeys = [
      'stockFocusTitle',
      'stockFocusDesc',
      'stockFocusPriceFirst',
      'stockFocusLoading',
      'stockFocusToday',
      'stockFocus1w',
      'stockFocus1mo',
      'stockFocusChartLink',
      'stockFocusScoreTitle',
      'stockFocusScoreDesc',
      'stockFocusActionBadge',
      'stockFocusDisclaimer',
    ] as const;
    for (const key of shellKeys) {
      expect(ko.market[key]).toBeTruthy();
      expect(en.market[key]).toBeTruthy();
    }
  });

  it('translateAnalysisInsight localizes divergence and regime evidence', () => {
    const localized = translateAnalysisInsight(
      {
        id: 'news-note',
        category: 'stockNewsNote',
        categoryLabel: '뉴스 참고 (후행)',
        tone: 'neutral',
        title: 'fallback title',
        summary: 'fallback summary',
        reasoning: 'fallback reasoning',
        titleKey: 'shared.market.insights.stockFocus.newsNote.title',
        summaryKey: 'shared.market.insights.stockFocus.newsNote.summary',
        summaryParams: {
          toneKey: 'bullish',
          change: '+1.00%',
          divergenceKey: 'bullish_news_price_down',
        },
        reasoningKey: 'shared.market.insights.stockFocus.newsNote.reasoning',
        evidence: [],
        evidenceItems: [
          {
            key: 'shared.market.insights.evidence.stockPresentRegime',
            params: { regimeKeys: 'globalRiskOff,syncBull' },
          },
        ],
        links: [],
        market: 'KR',
      },
      makeT(ko),
    );

    expect(localized.summary).toContain('긍정 뉴스 vs 가격 하락');
    expect(localized.evidence[0]).toContain('글로벌 리스크오프');
    expect(localized.evidence[0]).toContain('한·미 동반 강세');
  });

  it('translateAnalysisInsight localizes action rule trend in English', () => {
    const localized = translateAnalysisInsight(
      {
        id: 'action',
        category: 'stockAction',
        categoryLabel: 'Reference',
        tone: 'neutral',
        title: 'fallback',
        summary: 'fallback',
        reasoning: 'fallback',
        evidence: [],
        evidenceItems: [
          {
            key: 'shared.market.insights.evidence.stockActionRule',
            params: {
              ruleId: 'default_watch',
              rsi: '50',
              recentRangePct: '45',
              trendKey: 'up',
            },
          },
        ],
        links: [],
        market: 'US',
      },
      makeT(en),
    );

    expect(localized.evidence[0]).toContain('uptrend');
    expect(localized.evidence[0]).not.toMatch(/\btrend up\b/);
  });
});
