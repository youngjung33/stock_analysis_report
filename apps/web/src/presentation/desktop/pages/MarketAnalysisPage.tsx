'use client';

import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import { MarketAnalysisDetailSection } from '../../components/MarketAnalysisDetailSection';
import { DesktopLayout } from '../layout/DesktopLayout';
import { DesktopNavMenu } from '../navigation/DesktopNavMenu';

export function DesktopMarketAnalysisPage() {
  const { username, logout } = useAuth();

  return (
    <DesktopLayout
      title="시장 심층 분석"
      subtitle="VIX · 매크로 · 섹터 · 기술적 지표"
      headerActions={
        <DesktopNavMenu
          username={username ?? undefined}
          onLogout={() => logout()}
          active="market"
        />
      }
    >
      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <Link href="/" className="text-sm text-indigo-400 hover:text-indigo-300">
          ← 대시보드
        </Link>
        <MarketAnalysisDetailSection />
      </main>
    </DesktopLayout>
  );
}
