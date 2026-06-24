'use client';

import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import { MarketAnalysisDetailSection } from '../../components/MarketAnalysisDetailSection';
import { MobileLayout } from '../layout/MobileLayout';

export function MobileMarketAnalysisPage() {
  const { username, logout } = useAuth();

  return (
    <MobileLayout
      title="시장 분석"
      subtitle={username ?? undefined}
      onLogout={() => logout()}
      showFooterNav={false}
    >
      <Link href="/" className="mb-4 inline-block text-sm text-indigo-400 hover:text-indigo-300">
        ← 대시보드
      </Link>
      <MarketAnalysisDetailSection compact />
    </MobileLayout>
  );
}
