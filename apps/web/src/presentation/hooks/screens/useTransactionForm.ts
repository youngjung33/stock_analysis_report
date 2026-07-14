'use client';

import { FormEvent, useState } from 'react';
import { Market, StockSearchResult, TransactionType } from '@sar/shared';
import { parseAmountInput } from '@sar/shared';
import { getErrorMessage } from '@/client/domain/errors/app-error';
import { useToast } from '../../components/Toast';
import { useServices } from '../useServices';

export function useTransactionForm(onSuccess: () => void) {
  const { createTransactionUseCase } = useServices();
  const { showError, showSuccess } = useToast();
  const [selectedStock, setSelectedStock] = useState<StockSearchResult | null>(null);
  const [market, setMarket] = useState<Market>(Market.KR);
  const [type, setType] = useState<TransactionType>(TransactionType.BUY);
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [tradedAt, setTradedAt] = useState(new Date().toISOString().slice(0, 10));
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);

  function handleMarketChange(next: Market) {
    setMarket(next);
    setSelectedStock(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!selectedStock) {
      showError('종목을 검색해서 선택해 주세요.');
      return;
    }

    setLoading(true);
    try {
      await createTransactionUseCase.execute({
        stockSymbol: selectedStock.symbol,
        market: selectedStock.market,
        name: selectedStock.name,
        yahooSymbol: selectedStock.yahooSymbol,
        type,
        quantity: Number(quantity),
        price: parseAmountInput(price),
        tradedAt: new Date(tradedAt).toISOString(),
        memo: memo || undefined,
      });
      setSelectedStock(null);
      setQuantity('');
      setPrice('');
      setMemo('');
      showSuccess('거래가 등록되었습니다.');
      onSuccess();
    } catch (err) {
      showError(getErrorMessage(err, '거래 등록에 실패했습니다.'));
    } finally {
      setLoading(false);
    }
  }

  return {
    selectedStock,
    setSelectedStock,
    market,
    handleMarketChange,
    type,
    setType,
    quantity,
    setQuantity,
    price,
    setPrice,
    tradedAt,
    setTradedAt,
    memo,
    setMemo,
    loading,
    handleSubmit,
  };
}
