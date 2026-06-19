import { FormEvent, useState } from 'react';
import { Market, TransactionType } from '@sar/shared';
import { getErrorMessage } from '@/client/domain/errors/app-error';
import { useServices } from '../useServices';

export function useTransactionForm(onSuccess: () => void) {
  const { createTransactionUseCase } = useServices();
  const [stockSymbol, setStockSymbol] = useState('');
  const [market, setMarket] = useState<Market>(Market.KR);
  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.BUY);
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [tradedAt, setTradedAt] = useState(new Date().toISOString().slice(0, 10));
  const [memo, setMemo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await createTransactionUseCase.execute({
        stockSymbol,
        market,
        name: name || undefined,
        type,
        quantity: Number(quantity),
        price: Number(price),
        tradedAt: new Date(tradedAt).toISOString(),
        memo: memo || undefined,
      });
      setStockSymbol('');
      setName('');
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
    stockSymbol,
    setStockSymbol,
    market,
    setMarket,
    name,
    setName,
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
