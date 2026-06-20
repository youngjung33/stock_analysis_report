'use client';

import { useIsMobile } from '../hooks/useBreakpoint';
import { DesktopLoginPage } from '../desktop/pages/LoginPage';
import { MobileLoginPage } from '../mobile/pages/LoginPage';

export function LoginView() {
  const isMobile = useIsMobile();
  return isMobile ? <MobileLoginPage /> : <DesktopLoginPage />;
}
