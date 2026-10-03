import { Market } from '../enums';
import type { StockSectorTag } from './types';

/** Known symbols → sector tags (scoring·종목 해설; pool universe 아님) */
export const STOCK_SECTOR_TAGS: Record<string, Partial<Record<Market, StockSectorTag[]>>> = {
  '005930': { [Market.KR]: ['semiconductor', 'export'] },
  '000660': { [Market.KR]: ['semiconductor', 'export'] },
  '035420': { [Market.KR]: ['platform', 'domestic'] },
  '035720': { [Market.KR]: ['platform', 'domestic'] },
  '005380': { [Market.KR]: ['auto', 'export'] },
  '051910': { [Market.KR]: ['export'] },
  '055550': { [Market.KR]: ['finance', 'domestic'] },
  '105560': { [Market.KR]: ['finance', 'domestic'] },
  '000270': { [Market.KR]: ['auto', 'export'] },
  AAPL: { [Market.US]: ['platform'] },
  MSFT: { [Market.US]: ['platform'] },
  NVDA: { [Market.US]: ['semiconductor'] },
  GOOGL: { [Market.US]: ['platform'] },
  AMZN: { [Market.US]: ['platform'] },
  META: { [Market.US]: ['platform'] },
  AMD: { [Market.US]: ['semiconductor'] },
  AVGO: { [Market.US]: ['semiconductor'] },
  JPM: { [Market.US]: ['finance'] },
  BAC: { [Market.US]: ['finance'] },
  V: { [Market.US]: ['finance'] },
  XOM: { [Market.US]: ['energy'] },
  CVX: { [Market.US]: ['energy'] },
  UNH: { [Market.US]: ['healthcare'] },
  JNJ: { [Market.US]: ['healthcare'] },
};

export function getStockSectorTags(symbol: string, market: Market): StockSectorTag[] {
  return STOCK_SECTOR_TAGS[symbol.toUpperCase()]?.[market] ?? [];
}

/** Catalog 시총 데이터 없을 때만 쓰는 fallback (비회원 baseline) */
export const GUEST_BASELINE_FALLBACK_SYMBOLS: Record<Market, readonly string[]> = {
  [Market.KR]: [
    '005930',
    '000660',
    '035420',
    '035720',
    '005380',
    '051910',
    '055550',
    '105560',
    '000270',
  ],
  [Market.US]: [
    'AAPL',
    'MSFT',
    'NVDA',
    'GOOGL',
    'AMZN',
    'META',
    'AMD',
    'AVGO',
    'JPM',
    'BAC',
    'V',
    'XOM',
    'CVX',
    'UNH',
    'JNJ',
  ],
};
