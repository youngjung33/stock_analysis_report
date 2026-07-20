'use client';

import { MarketAnalysisDetailSection } from '../components/MarketAnalysisDetailSection';
import { AppShell } from '../layout';

export function MarketAnalysisPage() {
  return (
    <AppShell title="시장 심층 분석" subtitle="변동성 · 경기 · 업종 · 차트 지표">
      <MarketAnalysisDetailSection compact />
    </AppShell>
  );
}
