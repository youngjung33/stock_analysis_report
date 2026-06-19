'use client';

import { useIsMobile } from '../hooks/useBreakpoint';
import { DesktopDashboardPage } from '../desktop/pages/DashboardPage';
import { MobileDashboardPage } from '../mobile/pages/DashboardPage';

export function DashboardPage() {
  const isMobile = useIsMobile();
  return isMobile ? <MobileDashboardPage /> : <DesktopDashboardPage />;
}
