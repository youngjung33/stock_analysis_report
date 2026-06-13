import { Market } from '@sar/shared';
import { resolveCurrency, resolveYahooSymbol } from '@api/domain/services/stock-symbol.resolver';

describe('StockSymbolResolver', () => {
  // SS-01
  it('resolves KR symbol to .KS', () => {
    expect(resolveYahooSymbol('005930', Market.KR)).toBe('005930.KS');
    expect(resolveCurrency(Market.KR)).toBe('KRW');
  });

  // SS-02
  it('preserves .KQ suffix', () => {
    expect(resolveYahooSymbol('035720.KQ', Market.KR)).toBe('035720.KQ');
  });

  // SS-03
  it('resolves US symbol', () => {
    expect(resolveYahooSymbol('aapl', Market.US)).toBe('AAPL');
    expect(resolveCurrency(Market.US)).toBe('USD');
  });
});
