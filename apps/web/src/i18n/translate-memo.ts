'use client';

import { formatCashLedgerMemo } from '@sar/shared';
import type { TFunction } from 'i18next';

const LEGACY_BUY = /^(.+)\s+매수$/;
const LEGACY_SELL = /^(.+)\s+매도$/;
const LEGACY_DIVIDEND = /^(.+)\s+배당$/;
const TYPED_TRADE = /^(.+)\s+(BUY|SELL)$/;
const TYPED_DIVIDEND = /^(.+)\s+DIVIDEND$/;
const TYPED_CASH = /^(INITIAL|DEPOSIT|WITHDRAW):(KRW|USD)$/;

const LEGACY_CASH_MEMOS: Record<string, string> = {
  '투자 원금': 'capital.memoInitialCapital',
  'Invested capital': 'capital.memoInitialCapital',
  '투자 원금 (USD)': 'capital.memoInitialCapitalUsd',
  'Invested capital (USD)': 'capital.memoInitialCapitalUsd',
  입금: 'capital.memoDeposit',
  Deposit: 'capital.memoDeposit',
  출금: 'capital.memoWithdraw',
  Withdrawal: 'capital.memoWithdraw',
};

function translateCashMemoKind(kind: string, currency: string, t: TFunction): string {
  if (kind === 'INITIAL') {
    return currency === 'USD'
      ? t('capital.memoInitialCapitalUsd')
      : t('capital.memoInitialCapital');
  }
  if (kind === 'DEPOSIT') return t('capital.memoDeposit');
  if (kind === 'WITHDRAW') return t('capital.memoWithdraw');
  return `${kind}:${currency}`;
}

/** Ledger memo — supports legacy Korean and machine-readable BUY/SELL/DIVIDEND/CASH formats */
export function translateLedgerMemo(memo: string | null | undefined, t: TFunction): string {
  if (!memo) return '-';

  const legacyCashKey = LEGACY_CASH_MEMOS[memo];
  if (legacyCashKey) return t(legacyCashKey);

  const typedCash = memo.match(TYPED_CASH);
  if (typedCash) {
    return translateCashMemoKind(typedCash[1], typedCash[2], t);
  }

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

export { formatCashLedgerMemo };
