'use client';

import { Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Market } from '@sar/shared';
import { ProtectedRoute } from '@/presentation/routes/ProtectedRoute';
import { StockDetailPage } from '@/presentation/pages/StockDetailPage';

function StockDetailRouteInner() {
  const { t } = useTranslation();
  const params = useParams<{ symbol: string }>();
  const searchParams = useSearchParams();
  const symbol = decodeURIComponent(params.symbol);
  const marketParam = searchParams.get('market');
  const market = marketParam === Market.US ? Market.US : marketParam === Market.KR ? Market.KR : null;

  if (!market) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-rose-400">
        {t('pages.stockDetail.marketQueryRequired')}
      </div>
    );
  }

  return <StockDetailPage symbol={symbol} market={market} />;
}

export default function StockDetailRoutePage() {
  const { t } = useTranslation();

  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
            {t('common.loading')}
          </div>
        }
      >
        <StockDetailRouteInner />
      </Suspense>
    </ProtectedRoute>
  );
}
