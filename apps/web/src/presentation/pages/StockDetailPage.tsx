'use client';

import { Market } from '@sar/shared';
import { useTranslation } from 'react-i18next';
import { StockDetailContent } from '../components/StockDetailContent';
import { AppShell } from '../layout';

interface Props {
  symbol: string;
  market: Market;
}

export function StockDetailPage({ symbol, market }: Props) {
  const { t } = useTranslation();

  return (
    <AppShell title={t('pages.stockDetail.title')} subtitle={symbol} maxWidth="3xl">
      <StockDetailContent symbol={symbol} market={market} />
    </AppShell>
  );
}
