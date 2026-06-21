import { Market } from './index';

export function resolveYahooSymbol(symbol: string, market: Market): string | null {
  if (market === Market.US) return symbol.toUpperCase();
  const code = symbol.replace(/\.(KS|KQ)$/i, '');
  if (symbol.toUpperCase().endsWith('.KQ')) return `${code}.KQ`;
  return `${code}.KS`;
}

export function resolveCurrency(market: Market): string {
  return market === Market.KR ? 'KRW' : 'USD';
}
