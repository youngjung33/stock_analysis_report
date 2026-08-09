import { Market } from '../enums';
import { FEATURED_KR_STOCKS, FEATURED_US_STOCKS } from '../featured-stocks';
import type { StockSectorTag } from './types';

/** Featured + sector-leader symbols → sector tags for scoring */
export const STOCK_SECTOR_TAGS: Record<string, Partial<Record<Market, StockSectorTag[]>>> = {
  '005930': { [Market.KR]: ['semiconductor', 'export'] },
  '000660': { [Market.KR]: ['semiconductor', 'export'] },
  '035420': { [Market.KR]: ['platform', 'domestic'] },
  '035720': { [Market.KR]: ['platform', 'domestic'] },
  '005380': { [Market.KR]: ['auto', 'export'] },
  '051910': { [Market.KR]: ['export'] },
  AAPL: { [Market.US]: ['platform'] },
  MSFT: { [Market.US]: ['platform'] },
  NVDA: { [Market.US]: ['semiconductor'] },
  GOOGL: { [Market.US]: ['platform'] },
  AMZN: { [Market.US]: ['platform'] },
  META: { [Market.US]: ['platform'] },
};

/** Sector ETF label → representative catalog symbols */
export const SECTOR_LEADER_SYMBOLS: Record<
  Market,
  Record<string, { symbols: string[]; tags: StockSectorTag[] }>
> = {
  [Market.KR]: {
    반도체: { symbols: ['005930', '000660'], tags: ['semiconductor', 'export'] },
    금융: { symbols: ['055550', '105560'], tags: ['finance', 'domestic'] },
    자동차: { symbols: ['005380', '000270'], tags: ['auto', 'export'] },
  },
  [Market.US]: {
    기술: { symbols: ['AAPL', 'MSFT', 'GOOGL'], tags: ['platform'] },
    반도체: { symbols: ['NVDA', 'AMD', 'AVGO'], tags: ['semiconductor'] },
    금융: { symbols: ['JPM', 'BAC', 'V'], tags: ['finance'] },
    에너지: { symbols: ['XOM', 'CVX'], tags: ['energy'] },
    헬스케어: { symbols: ['UNH', 'JNJ'], tags: ['healthcare'] },
  },
};

export function getStockSectorTags(symbol: string, market: Market): StockSectorTag[] {
  return STOCK_SECTOR_TAGS[symbol.toUpperCase()]?.[market] ?? [];
}

export function collectSectorLeaderSymbols(): Array<{ symbol: string; market: Market; tags: StockSectorTag[] }> {
  const out: Array<{ symbol: string; market: Market; tags: StockSectorTag[] }> = [];
  for (const stock of [...FEATURED_KR_STOCKS, ...FEATURED_US_STOCKS]) {
    const tags = getStockSectorTags(stock.symbol, stock.market);
    if (tags.length > 0) {
      out.push({ symbol: stock.symbol, market: stock.market, tags });
    }
  }
  for (const [marketKey, sectors] of Object.entries(SECTOR_LEADER_SYMBOLS)) {
    const market = marketKey as Market;
    for (const entry of Object.values(sectors)) {
      for (const symbol of entry.symbols) {
        if (!out.some((x) => x.symbol === symbol && x.market === market)) {
          out.push({ symbol, market, tags: entry.tags });
        }
      }
    }
  }
  return out;
}
