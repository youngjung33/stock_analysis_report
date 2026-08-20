export type CashLedgerMemoKind = 'INITIAL' | 'DEPOSIT' | 'WITHDRAW';

/** Cash ledger memo — machine-readable; UI translates at display time */
export function formatCashLedgerMemo(kind: CashLedgerMemoKind, currency: 'KRW' | 'USD'): string {
  return `${kind}:${currency}`;
}

/** Trade memo — machine-readable; UI translates at display time */
export function formatTradeLedgerMemo(
  symbol: string,
  side: 'BUY' | 'SELL',
  options?: { securitiesTaxKrw?: number },
): string {
  if (side === 'SELL' && options?.securitiesTaxKrw && options.securitiesTaxKrw > 0) {
    return `${symbol} SELL|STT:${options.securitiesTaxKrw}`;
  }
  return `${symbol} ${side}`;
}

export function formatDividendLedgerMemo(symbol: string): string {
  return `${symbol} DIVIDEND`;
}
