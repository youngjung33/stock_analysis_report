import { Market } from '@sar/shared';
import { RefreshQuoteResult } from '../models';

export interface QuoteRefreshNotice {
  variant: 'success' | 'warning' | 'error';
  lines: string[];
}

const MARKET_SHORT: Record<Market, string> = {
  [Market.KR]: '한국',
  [Market.US]: '미국',
};

function groupSucceededByMarket(succeeded: RefreshQuoteResult['succeeded']): string[] {
  const byMarket = new Map<Market, string[]>();
  for (const item of succeeded) {
    const list = byMarket.get(item.market) ?? [];
    list.push(item.symbol);
    byMarket.set(item.market, list);
  }

  return [...byMarket.entries()].map(
    ([market, symbols]) => `${MARKET_SHORT[market]} ${symbols.length}건 갱신: ${symbols.join(', ')}`,
  );
}

function groupFailedByReason(failed: RefreshQuoteResult['failed']): string[] {
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
    if (reasonCode === 'not_configured') {
      return `갱신 불가 (${symbolList}) — ${reason}`;
    }
    if (reasonCode === 'no_provider') {
      return `갱신 불가 (${symbolList}) — ${reason}`;
    }
    return `조회 실패 (${symbolList}) — ${reason}`;
  });
}

export function buildQuoteRefreshNotice(result: RefreshQuoteResult): QuoteRefreshNotice | null {
  const lines: string[] = [];

  if (result.succeeded.length > 0) {
    lines.push(...groupSucceededByMarket(result.succeeded));
  }

  if (result.failed.length > 0) {
    lines.push(...groupFailedByReason(result.failed));
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
): string[] {
  return providers.map((provider) => {
    if (provider.available) {
      return `${provider.label} — 이용 가능`;
    }
    return `${provider.label} — 이용 불가${provider.setupHint ? `: ${provider.setupHint}` : ''}`;
  });
}
