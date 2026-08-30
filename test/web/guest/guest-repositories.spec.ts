/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Market, TransactionType, CashLedgerType } from '@sar/shared';
import { GuestWatchlistRepository, GuestCorporateActionRepository } from '@/client/data/guest/guest-feature.repositories';
import { GuestPortfolioRepository } from '@/client/data/guest/guest-portfolio.repository';
import { GuestTransactionRepository } from '@/client/data/guest/guest-transaction.repository';
import {
  clearGuestStore,
  getGuestCashBalances,
  saveGuestCashEntry,
  saveGuestTransaction,
  createGuestStock,
} from '@/client/data/guest/guest-storage';
import { IMarketRepository } from '@/client/domain/repositories';

function createFakeMarketRepo(): IMarketRepository {
  return {
    getStatus: vi.fn(),
    getFeaturedQuotes: vi.fn(),
    getStockQuote: vi.fn(),
    searchStocks: vi.fn(),
    getFxRate: vi.fn().mockResolvedValue({ usdKrwRate: 1300 }),
    fetchBatchQuotes: vi.fn().mockResolvedValue({ updated: 0, quotes: [], succeeded: [], failed: [] }),
    getMarketAnalysis: vi.fn(),
  };
}

describe('GuestWatchlistRepository', () => {
  beforeEach(() => {
    clearGuestStore();
  });

  it('adds and lists watchlist items in sessionStorage', async () => {
    const repo = new GuestWatchlistRepository();
    await repo.add({ symbol: '005930', name: '삼성전자', market: Market.KR });
    const items = await repo.list();
    expect(items).toHaveLength(1);
    expect(items[0]?.symbol).toBe('005930');
  });

  it('removes watchlist item by id', async () => {
    const repo = new GuestWatchlistRepository();
    const item = await repo.add({ symbol: 'AAPL', name: 'Apple', market: Market.US });
    await repo.remove(item.id);
    expect(await repo.list()).toHaveLength(0);
  });
});

describe('GuestCorporateActionRepository', () => {
  beforeEach(() => {
    clearGuestStore();
  });

  it('creates corporate action in sessionStorage', async () => {
    const repo = new GuestCorporateActionRepository();
    await repo.create({
      stockSymbol: '005930',
      name: '삼성전자',
      market: Market.KR,
      type: 'DIVIDEND',
      effectiveAt: new Date().toISOString(),
    });
    const items = await repo.list();
    expect(items).toHaveLength(1);
  });

  it('records dividend cash in guest ledger', async () => {
    const repo = new GuestCorporateActionRepository();
    await repo.create({
      stockSymbol: '005930',
      name: '삼성전자',
      market: Market.KR,
      type: 'DIVIDEND',
      effectiveAt: new Date().toISOString(),
      cashAmount: 500_000,
    });
    expect(getGuestCashBalances().krw).toBe(500_000);
  });

  it('lists corporate actions with stock info and deletes dividend cash', async () => {
    const repo = new GuestCorporateActionRepository();
    await repo.create({
      stockSymbol: '005930',
      name: '삼성전자',
      market: Market.KR,
      type: 'DIVIDEND',
      effectiveAt: new Date().toISOString(),
      cashAmount: 500_000,
    });
    const items = await repo.list();
    expect(items[0]?.stock?.symbol).toBe('005930');
    expect(items[0]?.stock?.name).toBe('삼성전자');
    await repo.delete(items[0]!.id);
    expect(await repo.list()).toHaveLength(0);
    expect(getGuestCashBalances().krw).toBe(0);
  });
});

describe('GuestPortfolioRepository', () => {
  beforeEach(() => {
    clearGuestStore();
  });

  it('returns empty dashboard when no transactions', async () => {
    const repo = new GuestPortfolioRepository(createFakeMarketRepo());
    const dashboard = await repo.getDashboard();
    expect(dashboard.holdings).toEqual([]);
    expect(dashboard.summary.holdingsCount).toBe(0);
  });

  it('getAnalysis posts holdings snapshot to server', async () => {
    const { apiClient } = await import('@/client/data/api/client');
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: {
        portfolioReturns: [],
        holdingReturns: [],
        benchmarkComparisons: [],
        holdingsInsights: [],
        fxRate: null,
        asOf: new Date().toISOString(),
        allocationByMarket: { kr: 0, us: 0, cash: 0 },
      },
    } as never);

    const repo = new GuestPortfolioRepository(createFakeMarketRepo());
    const result = await repo.getAnalysis();
    expect(result.portfolioReturns).toEqual([]);
    expect(postSpy).toHaveBeenCalledWith(
      '/portfolio/analysis',
      expect.objectContaining({ holdings: expect.any(Array) }),
    );
    postSpy.mockRestore();
  });

  it('aggregates dashboard from guest transactions', async () => {
    const stock = createGuestStock('005930', Market.KR, '삼성전자');
    saveGuestTransaction({
      id: 'tx-1',
      userId: 'guest',
      stockId: stock.id,
      type: TransactionType.BUY,
      quantity: 10,
      price: 70000,
      tradedAt: new Date().toISOString(),
      memo: null,
      stock,
    });

    const repo = new GuestPortfolioRepository(createFakeMarketRepo());
    const dashboard = await repo.getDashboard();
    expect(dashboard.summary.holdingsCount).toBe(1);
    expect(dashboard.holdings[0]?.symbol).toBe('005930');
  });
});

describe('GuestTransactionRepository', () => {
  beforeEach(() => {
    clearGuestStore();
    saveGuestCashEntry({
      currency: 'KRW',
      type: CashLedgerType.DEPOSIT,
      amount: 10_000_000,
      refId: null,
      memo: 'DEPOSIT:KRW',
      occurredAt: new Date().toISOString(),
    });
  });

  it('deducts commission from guest cash on KR buy', async () => {
    const repo = new GuestTransactionRepository();
    await repo.create({
      stockSymbol: '005930',
      market: Market.KR,
      name: '삼성전자',
      type: TransactionType.BUY,
      quantity: 10,
      price: 70_000,
      commission: 1_000,
      tradedAt: new Date().toISOString(),
    });

    expect(getGuestCashBalances().krw).toBe(10_000_000 - 701_000);
  });

  it('reflects buy commission in guest holding average cost', async () => {
    const txRepo = new GuestTransactionRepository();
    await txRepo.create({
      stockSymbol: '005930',
      market: Market.KR,
      name: '삼성전자',
      type: TransactionType.BUY,
      quantity: 10,
      price: 70_000,
      commission: 1_000,
      tradedAt: new Date().toISOString(),
    });

    const portfolioRepo = new GuestPortfolioRepository(createFakeMarketRepo());
    const dashboard = await portfolioRepo.getDashboard();
    expect(dashboard.holdings[0]?.averageCost).toBe(70_100);
    expect(dashboard.holdings[0]?.costBasis).toBe(701_000);
  });
});
