'use client';

import { MarketAnalysisDetailSection } from '../../components/MarketAnalysisDetailSection';
import { AppShell } from '../../layout';

export function MobileMarketAnalysisPage() {
  return (
    <AppShell title="시장 분석" subtitle="VIX · 매크로 · 섹터">
      <MarketAnalysisDetailSection compact />
    </AppShell>
  );
}
