import { Market } from './enums';

export interface AllocationHoldingInput {
  symbol: string;
  name: string;
  market: Market;
  marketValueKrw: number | null;
}

export interface AllocationItem {
  symbol: string;
  name: string;
  market: Market;
  marketValueKrw: number;
  weightPercent: number;
}

export interface AllocationByMarket {
  krPercent: number;
  usPercent: number;
}

export interface AllocationResult {
  items: AllocationItem[];
  allocationByMarket: AllocationByMarket;
}

export function computeAllocation(holdings: AllocationHoldingInput[]): AllocationResult {
  const eligible = holdings.filter(
    (h): h is AllocationHoldingInput & { marketValueKrw: number } =>
      h.marketValueKrw !== null && h.marketValueKrw > 0,
  );

  const total = eligible.reduce((sum, h) => sum + h.marketValueKrw, 0);
  if (total <= 0) {
    return {
      items: [],
      allocationByMarket: { krPercent: 0, usPercent: 0 },
    };
  }

  let krValue = 0;
  let usValue = 0;

  const items: AllocationItem[] = eligible.map((h) => {
    if (h.market === Market.KR) krValue += h.marketValueKrw;
    else usValue += h.marketValueKrw;
    return {
      symbol: h.symbol,
      name: h.name,
      market: h.market,
      marketValueKrw: h.marketValueKrw,
      weightPercent: (h.marketValueKrw / total) * 100,
    };
  });

  return {
    items,
    allocationByMarket: {
      krPercent: (krValue / total) * 100,
      usPercent: (usValue / total) * 100,
    },
  };
}
