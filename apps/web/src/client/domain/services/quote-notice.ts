import type { TFunction } from 'i18next';
import { Market, type QuoteFailureReasonCode, type QuoteSetupHintCode } from '@sar/shared';
import { translateMarketLabel } from '@/i18n/translate-shared';
import { RefreshQuoteResult } from '../models';

export interface QuoteRefreshNotice {
  variant: 'success' | 'warning' | 'error';
  lines: string[];
}

function translateQuoteReason(code: QuoteFailureReasonCode | QuoteSetupHintCode, t: TFunction): string {
  return t(`quotes.reason.${code}`);
}

function groupSucceededByMarket(
  succeeded: RefreshQuoteResult['succeeded'],
  t: TFunction,
): string[] {
  const byMarket = new Map<Market, string[]>();
  for (const item of succeeded) {
    const list = byMarket.get(item.market) ?? [];
    list.push(item.symbol);
    byMarket.set(item.market, list);
  }

  return [...byMarket.entries()].map(([market, symbols]) =>
    t('quotes.refresh.marketUpdated', {
      market: translateMarketLabel(market, t),
      count: symbols.length,
      symbols: symbols.join(', '),
    }),
  );
}

function groupFailedByReason(failed: RefreshQuoteResult['failed'], t: TFunction): string[] {
  const byReason = new Map<QuoteFailureReasonCode, string[]>();

  for (const item of failed) {
    const list = byReason.get(item.reasonCode) ?? [];
    list.push(item.symbol);
    byReason.set(item.reasonCode, list);
  }

  return [...byReason.entries()].map(([reasonCode, symbols]) => {
    const symbolList = symbols.join(', ');
    const reason = translateQuoteReason(reasonCode, t);
    if (reasonCode === 'not_configured' || reasonCode === 'no_provider') {
      return t('quotes.refresh.refreshBlocked', { symbols: symbolList, reason });
    }
    return t('quotes.refresh.queryFailed', { symbols: symbolList, reason });
  });
}

export function buildQuoteRefreshNotice(
  result: RefreshQuoteResult,
  t: TFunction,
): QuoteRefreshNotice | null {
  const lines: string[] = [];

  if (result.succeeded.length > 0) {
    lines.push(...groupSucceededByMarket(result.succeeded, t));
  }

  if (result.failed.length > 0) {
    lines.push(...groupFailedByReason(result.failed, t));
  }

  if (lines.length === 0) {
    return null;
  }

  if (result.updated > 0 && result.failed.length > 0) {
    return { variant: 'warning', lines };
  }
  if (result.updated > 0) {
    return { variant: 'success', lines };
  }
  return { variant: 'error', lines };
}

export function buildMarketStatusLines(
  providers: { market: Market; available: boolean; setupHintCode: QuoteSetupHintCode | null }[],
  t: TFunction,
): string[] {
  return providers.map((provider) => {
    const label = translateMarketLabel(provider.market, t);
    if (provider.available) {
      return t('quotes.notice.providerAvailable', { label });
    }
    const hint = provider.setupHintCode
      ? `: ${translateQuoteReason(provider.setupHintCode, t)}`
      : '';
    return t('quotes.notice.providerUnavailable', { label, hint });
  });
}
