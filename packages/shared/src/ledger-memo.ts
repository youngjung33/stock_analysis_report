/** Cash ledger / trade memo — machine-readable; UI translates at display time */
export function formatTradeLedgerMemo(symbol: string, side: 'BUY' | 'SELL'): string {
  return `${symbol} ${side}`;
}

export function formatDividendLedgerMemo(symbol: string): string {
  return `${symbol} DIVIDEND`;
}
