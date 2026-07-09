'use client';

import { MarketAnalysisDetailSection } from '../components/MarketAnalysisDetailSection';
import { AppShell } from '../layout';

export function MarketAnalysisPage() {
  return (
    <AppShell title="시장 심층 분석" subtitle="VIX · 매크로 · 섹터 · 기술적 지표">
      <MarketAnalysisDetailSection compact />
    </AppShell>
  );
}
