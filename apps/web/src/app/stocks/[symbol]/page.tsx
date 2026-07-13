'use client';

import { Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Market } from '@sar/shared';
import { ProtectedRoute } from '@/presentation/routes/ProtectedRoute';
import { StockDetailPage } from '@/presentation/pages/StockDetailPage';

function StockDetailRouteInner() {
  const params = useParams<{ symbol: string }>();
  const searchParams = useSearchParams();
  const symbol = decodeURIComponent(params.symbol);
  const marketParam = searchParams.get('market');
  const market = marketParam === Market.US ? Market.US : marketParam === Market.KR ? Market.KR : null;

  if (!market) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-rose-400">
        market 쿼리(KR 또는 US)가 필요합니다.
      </div>
    );
  }

  return <StockDetailPage symbol={symbol} market={market} />;
}

export default function StockDetailRoutePage() {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
            로딩 중...
          </div>
        }
      >
        <StockDetailRouteInner />
      </Suspense>
    </ProtectedRoute>
  );
}
