import { Market } from '@sar/shared';

export function stockDetailHref(symbol: string, market: Market, name?: string): string {
  const params = new URLSearchParams({ market });
  if (name) params.set('name', name);
  return `/stocks/${encodeURIComponent(symbol)}?${params.toString()}`;
}

export function marketAnalysisHref(): string {
  return '/market/analysis';
}
