import { FormEvent, useState } from 'react';
import { Market, StockSearchResult, TransactionType } from '@sar/shared';
import { getErrorMessage } from '@/client/domain/errors/app-error';
import { useServices } from '../useServices';

export function useTransactionForm(onSuccess: () => void) {
  const { createTransactionUseCase } = useServices();
  const [selectedStock, setSelectedStock] = useState<StockSearchResult | null>(null);
  const [market, setMarket] = useState<Market>(Market.KR);
  const [type, setType] = useState<TransactionType>(TransactionType.BUY);
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [tradedAt, setTradedAt] = useState(new Date().toISOString().slice(0, 10));
  const [memo, setMemo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleMarketChange(next: Market) {
    setMarket(next);
    setSelectedStock(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!selectedStock) {
      setError('종목을 검색해서 선택해 주세요.');
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
        price: Number(price),
        tradedAt: new Date(tradedAt).toISOString(),
        memo: memo || undefined,
      });
      setSelectedStock(null);
      setQuantity('');
      setPrice('');
      setMemo('');
      onSuccess();
    } catch (err) {
      setError(getErrorMessage(err, '등록 실패'));
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
    error,
    loading,
    handleSubmit,
  };
}
