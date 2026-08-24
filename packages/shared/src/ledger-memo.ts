export type CashLedgerMemoKind = 'INITIAL' | 'DEPOSIT' | 'WITHDRAW';

/** Cash ledger memo — machine-readable; UI translates at display time */
export function formatCashLedgerMemo(kind: CashLedgerMemoKind, currency: 'KRW' | 'USD'): string {
  return `${kind}:${currency}`;
}

/** Trade memo — machine-readable; UI translates at display time */
export function formatTradeLedgerMemo(
  symbol: string,
  side: 'BUY' | 'SELL',
  options?: { securitiesTaxKrw?: number; commission?: number },
): string {
  const parts: string[] = [`${symbol} ${side}`];
  if (side === 'SELL' && options?.securitiesTaxKrw && options.securitiesTaxKrw > 0) {
    parts[0] = `${symbol} SELL|STT:${options.securitiesTaxKrw}`;
  }
  if (options?.commission && options.commission > 0) {
    parts.push(`FEE:${Math.round(options.commission)}`);
  }
  return parts.join('|');
}

export function formatDividendLedgerMemo(symbol: string): string {
  return `${symbol} DIVIDEND`;
}
