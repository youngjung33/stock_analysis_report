'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  estimateKoreanTax,
  type KoreanTaxEstimate,
  type TaxStockHistory,
} from '@sar/shared';
import { useServices } from '../useServices';
import { useTaxProfile } from '../useTaxProfile';
import { useDashboard } from '../useDashboard';

export function useTaxScreen(refreshKey = 0) {
  const { listTransactionsUseCase, listCorporateActionsUseCase } = useServices();
  const { profile, updateProfile } = useTaxProfile();
  const { data: dashboard } = useDashboard();
  const [loading, setLoading] = useState(true);
  const [histories, setHistories] = useState<TaxStockHistory[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [txs, corpActions] = await Promise.all([
        listTransactionsUseCase.execute(),
        listCorporateActionsUseCase.execute(),
      ]);
      const byStock = new Map<string, TaxStockHistory>();

      for (const tx of txs) {
        if (!tx.stock) continue;
        const existing = byStock.get(tx.stockId) ?? {
          symbol: tx.stock.symbol,
          market: tx.stock.market,
          currency: tx.stock.currency,
          transactions: [],
          corporateActions: [],
        };
        existing.transactions.push({
          type: tx.type,
          quantity: tx.quantity,
          price: tx.price,
          tradedAt: tx.tradedAt,
        });
        byStock.set(tx.stockId, existing);
      }

      for (const action of corpActions) {
        const stock = action.stock;
        if (!stock) continue;
        const existing = byStock.get(action.stockId) ?? {
          symbol: stock.symbol,
          market: stock.market,
          currency: stock.currency,
          transactions: [],
          corporateActions: [],
        };
        existing.corporateActions.push({
          type: action.type,
          effectiveAt: action.effectiveAt,
          cashAmount: action.cashAmount,
          splitRatio: action.splitRatio,
          targetQuantity: action.targetQuantity,
          targetPrice: action.targetPrice,
        });
        byStock.set(action.stockId, existing);
      }

      setHistories([...byStock.values()]);
    } finally {
      setLoading(false);
    }
  }, [listTransactionsUseCase, listCorporateActionsUseCase]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const usdKrwRate = dashboard?.summary.usdKrwRate ?? null;

  const estimate: KoreanTaxEstimate | null = useMemo(() => {
    if (loading) return null;
    return estimateKoreanTax(histories, profile, usdKrwRate);
  }, [histories, profile, usdKrwRate, loading]);

  return {
    profile,
    updateProfile,
    loading,
    estimate,
    usdKrwRate,
    reload: load,
  };
}
