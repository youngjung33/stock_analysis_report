import { Market } from '@sar/shared';

export function stockDetailHref(symbol: string, market: Market): string {
  return `/stocks/${encodeURIComponent(symbol)}?market=${market}`;
}

export function marketAnalysisHref(): string {
  return '/market/analysis';
}
