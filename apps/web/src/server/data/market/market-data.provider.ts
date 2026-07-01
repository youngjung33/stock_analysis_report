import { Market, QuoteChartRange, StockSearchResult } from '@sar/shared';
import { StockEntity } from '../../domain/entities';
import {
  ChartQuoteData,
  ChartSeriesData,
  IMarketDataProvider,
  NewsItemData,
} from '../../domain/ports/market-data.port';
import { fetchFinnhubMarketNews } from './finnhub-news.client';
import { fetchGoogleNewsRss } from './google-news-rss.client';
import { fetchUsdKrwRate } from './usd-krw.client';
import { fetchYahooChartQuote, fetchYahooChartSeries } from './yahoo-chart.client';
import { fetchYahooStockSearch } from './yahoo-search.client';
import { KrYahooMarketProvider } from './kr-yahoo.provider';
import { UsFinnhubMarketProvider } from './us-finnhub.provider';

/** KR/US 시세 adapter — 단일 IMarketDataProvider 구현체 */
export class MarketDataProvider implements IMarketDataProvider {
  private readonly kr = new KrYahooMarketProvider();
  private readonly us = new UsFinnhubMarketProvider();

  private quoteAdapter(market: Market) {
    return market === Market.KR ? this.kr : this.us;
  }

  supports(market: Market) {
    return this.quoteAdapter(market).supports(market);
  }

  label(market: Market) {
    return this.quoteAdapter(market).label();
  }

  isAvailable(market: Market) {
    return this.quoteAdapter(market).isAvailable();
  }

  unavailableReason(market: Market) {
    return this.quoteAdapter(market).unavailableReason();
  }

  fetchStockQuote(stock: StockEntity) {
    return this.quoteAdapter(stock.market as Market).fetchQuote(stock);
  }

  fetchUsdKrwRate() {
    return fetchUsdKrwRate();
  }

  async fetchChartQuote(symbol: string, range: QuoteChartRange): Promise<ChartQuoteData> {
    const quote = await fetchYahooChartQuote(symbol, range);
    return {
      currentPrice: quote.currentPrice,
      changePercent: quote.changePercent,
      points: quote.points,
    };
  }

  async fetchChartSeries(
    symbol: string,
    yahooRange = '1y',
    interval = '1d',
  ): Promise<ChartSeriesData> {
    const series = await fetchYahooChartSeries(symbol, yahooRange, interval);
    return {
      symbol: series.symbol,
      closes: series.closes,
      volumes: series.volumes,
      highs: series.highs,
      lows: series.lows,
      changePercent1d: series.changePercent1d,
    };
  }

  async fetchGoogleNews(
    query: string,
    market: Market | 'global',
    hl: string,
    gl: string,
    limit = 6,
  ): Promise<NewsItemData[]> {
    const items = await fetchGoogleNewsRss(query, market, hl, gl, limit);
    return items.map((item) => ({
      title: item.title,
      source: item.source,
      publishedAt: item.publishedAt,
      url: item.url,
      market: item.market,
    }));
  }

  async fetchFinnhubMarketNews(
    category: 'general' | 'forex' | 'crypto' | 'merger',
    limit = 8,
  ): Promise<NewsItemData[]> {
    const items = await fetchFinnhubMarketNews(category, limit);
    return items.map((item) => ({
      title: item.headline,
      source: item.source,
      publishedAt: new Date(item.datetime * 1000).toISOString(),
      url: item.url,
      market: 'global' as const,
    }));
  }

  searchRemoteStocks(query: string, market: Market): Promise<StockSearchResult[]> {
    return fetchYahooStockSearch(query, market);
  }
}
