'use client';

import { useIsMobile } from '../hooks/useBreakpoint';
import { DesktopTransactionsPage } from '../desktop/pages/TransactionsPage';
import { MobileTransactionsPage } from '../mobile/pages/TransactionsPage';

export function TransactionsPage() {
  const isMobile = useIsMobile();
  return isMobile ? <MobileTransactionsPage /> : <DesktopTransactionsPage />;
}
