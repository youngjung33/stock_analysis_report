'use client';

import { Market } from '@sar/shared';
import { useTranslation } from 'react-i18next';
import { StockDetailContent } from '../components/StockDetailContent';
import { AppShell } from '../layout';

interface Props {
  symbol: string;
  market: Market;
  name?: string | null;
}

export function StockDetailPage({ symbol, market, name }: Props) {
  const { t } = useTranslation();

  return (
    <AppShell title={t('pages.stockDetail.title')} subtitle={name ?? symbol} maxWidth="3xl">
      <StockDetailContent symbol={symbol} market={market} name={name} />
    </AppShell>
  );
}
