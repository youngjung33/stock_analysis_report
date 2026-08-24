'use client';

import { formatCashLedgerMemo } from '@sar/shared';
import type { TFunction } from 'i18next';

const LEGACY_BUY = /^(.+)\s+매수$/;
const LEGACY_SELL = /^(.+)\s+매도$/;
const LEGACY_DIVIDEND = /^(.+)\s+배당$/;
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

interface ParsedTradeMemo {
  symbol: string;
  side: 'BUY' | 'SELL';
  stt?: number;
  fee?: number;
}

function parseTradeMemo(memo: string): ParsedTradeMemo | null {
  const segments = memo.split('|');
  const head = segments[0];
  let fee: number | undefined;
  let stt: number | undefined;

  for (let i = 1; i < segments.length; i++) {
    const feeMatch = segments[i].match(/^FEE:(\d+)$/);
    if (feeMatch) fee = Number(feeMatch[1]);
    const sttMatch = segments[i].match(/^STT:(\d+)$/);
    if (sttMatch) stt = Number(sttMatch[1]);
  }

  const plain = head.match(/^(.+)\s+(BUY|SELL)$/);
  if (plain) {
    return { symbol: plain[1], side: plain[2] as 'BUY' | 'SELL', stt, fee };
  }

  return null;
}

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

function translateTradeMemo(parsed: ParsedTradeMemo, t: TFunction): string {
  const sideKey = parsed.side === 'BUY' ? 'buy' : 'sell';
  const side = t(`transactions.form.${sideKey}`);

  if (parsed.stt != null && parsed.fee != null) {
    return t('transactions.memo.tradeWithSttAndFee', {
      symbol: parsed.symbol,
      side,
      tax: parsed.stt.toLocaleString(),
      fee: parsed.fee.toLocaleString(),
    });
  }
  if (parsed.stt != null) {
    return t('transactions.memo.tradeWithStt', {
      symbol: parsed.symbol,
      side,
      tax: parsed.stt.toLocaleString(),
    });
  }
  if (parsed.fee != null) {
    return t('transactions.memo.tradeWithFee', {
      symbol: parsed.symbol,
      side,
      fee: parsed.fee.toLocaleString(),
    });
  }
  return t('transactions.memo.trade', { symbol: parsed.symbol, side });
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

  const parsedTrade = parseTradeMemo(memo);
  if (parsedTrade) {
    return translateTradeMemo(parsedTrade, t);
  }

  const typedDividend = memo.match(TYPED_DIVIDEND);
  if (typedDividend) {
    return t('transactions.memo.dividend', { symbol: typedDividend[1] });
  }

  return memo;
}

export { formatCashLedgerMemo };
