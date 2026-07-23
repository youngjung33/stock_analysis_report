import type { TFunction } from 'i18next';

const LEGACY_BUY = /^(.+)\s+매수$/;
const LEGACY_SELL = /^(.+)\s+매도$/;
const LEGACY_DIVIDEND = /^(.+)\s+배당$/;
const TYPED_TRADE = /^(.+)\s+(BUY|SELL)$/;
const TYPED_DIVIDEND = /^(.+)\s+DIVIDEND$/;

/** Ledger memo — supports legacy Korean and machine-readable BUY/SELL/DIVIDEND formats */
export function translateLedgerMemo(memo: string | null | undefined, t: TFunction): string {
  if (!memo) return '-';

  const legacyBuy = memo.match(LEGACY_BUY);
  if (legacyBuy) {
    return t('transactions.memo.trade', { symbol: legacyBuy[1], side: t('transactions.form.buy') });
  }

  const legacySell = memo.match(LEGACY_SELL);
  if (legacySell) {
    return t('transactions.memo.trade', { symbol: legacySell[1], side: t('transactions.form.sell') });
  }

  const legacyDividend = memo.match(LEGACY_DIVIDEND);
  if (legacyDividend) {
    return t('transactions.memo.dividend', { symbol: legacyDividend[1] });
  }

  const typedTrade = memo.match(TYPED_TRADE);
  if (typedTrade) {
    const sideKey = typedTrade[2] === 'BUY' ? 'buy' : 'sell';
    return t('transactions.memo.trade', {
      symbol: typedTrade[1],
      side: t(`transactions.form.${sideKey}`),
    });
  }

  const typedDividend = memo.match(TYPED_DIVIDEND);
  if (typedDividend) {
    return t('transactions.memo.dividend', { symbol: typedDividend[1] });
  }

  return memo;
}
