import { Market, TransactionType } from './enums';
import { computeKrSellNetProceeds } from './korean-tax';

export interface TradeCashSettlement {
  notional: number;
  commission: number;
  securitiesTaxKrw: number;
  /** Absolute amount passed to SettleCashUseCase (before sign) */
  settleAmount: number;
  currency: 'KRW' | 'USD';
}

/** BUY/SELL cash settlement — notional + commission + KR STT on sell */
export function computeTradeCashSettlement(input: {
  type: TransactionType;
  quantity: number;
  price: number;
  market: Market;
  commission?: number;
}): TradeCashSettlement {
  const commission = Math.max(0, input.commission ?? 0);
  const notional = input.quantity * input.price;
  const currency = input.market === Market.KR ? 'KRW' : 'USD';

  if (input.type === TransactionType.BUY) {
    return {
      notional,
      commission,
      securitiesTaxKrw: 0,
      settleAmount: notional + commission,
      currency,
    };
  }

  const sellSettlement = computeKrSellNetProceeds(notional, input.market);
  const grossCredit = input.market === Market.KR ? sellSettlement.netKrw : notional;

  return {
    notional,
    commission,
    securitiesTaxKrw: sellSettlement.securitiesTaxKrw,
    settleAmount: Math.max(0, grossCredit - commission),
    currency,
  };
}
