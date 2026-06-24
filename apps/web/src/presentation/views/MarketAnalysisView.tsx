'use client';

import { useIsMobile } from '../hooks/useBreakpoint';
import { DesktopMarketAnalysisPage } from '../desktop/pages/MarketAnalysisPage';
import { MobileMarketAnalysisPage } from '../mobile/pages/MarketAnalysisPage';

export function MarketAnalysisView() {
  const isMobile = useIsMobile();
  return isMobile ? <MobileMarketAnalysisPage /> : <DesktopMarketAnalysisPage />;
}
