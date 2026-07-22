import type { TFunction } from 'i18next';
import { Market } from '@sar/shared';
import { translateMarketLabel } from '@/i18n/translate-shared';
import { RefreshQuoteResult } from '../models';

export interface QuoteRefreshNotice {
  variant: 'success' | 'warning' | 'error';
  lines: string[];
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
  const byReason = new Map<string, { symbols: string[]; reasonCode: string }>();

  for (const item of failed) {
    const key = `${item.reasonCode}:${item.reason}`;
    const entry = byReason.get(key) ?? { symbols: [], reasonCode: item.reasonCode };
    entry.symbols.push(item.symbol);
    byReason.set(key, { ...entry, reasonCode: item.reasonCode });
  }

  return [...byReason.entries()].map(([key, { symbols, reasonCode }]) => {
    const reason = key.slice(reasonCode.length + 1);
    const symbolList = symbols.join(', ');
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
  providers: { label: string; available: boolean; setupHint: string | null }[],
  t: TFunction,
): string[] {
  return providers.map((provider) => {
    if (provider.available) {
      return t('quotes.notice.providerAvailable', { label: provider.label });
    }
    return t('quotes.notice.providerUnavailable', {
      label: provider.label,
      hint: provider.setupHint ? `: ${provider.setupHint}` : '',
    });
  });
}
