import type { LucideIcon } from 'lucide-react';
import { ArrowLeftRight, LayoutDashboard, LineChart, Receipt, UserCircle } from 'lucide-react';

export type NavSectionId = 'dashboard' | 'my-info' | 'transactions' | 'market' | 'tax';

export interface AppNavItem {
  id: NavSectionId;
  href: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  /** pathname prefix match (exact if ends without *) */
  match: (pathname: string) => boolean;
}

export const APP_NAV_ITEMS: AppNavItem[] = [
  {
    id: 'dashboard',
    href: '/',
    label: '투자 현황',
    shortLabel: '홈',
    icon: LayoutDashboard,
    match: (pathname) => pathname === '/' || pathname.startsWith('/stocks'),
  },
  {
    id: 'my-info',
    href: '/my-info',
    label: '내 정보',
    shortLabel: '내 정보',
    icon: UserCircle,
    match: (pathname) => pathname.startsWith('/my-info'),
  },
  {
    id: 'transactions',
    href: '/transactions',
    label: '매매·배당',
    shortLabel: '매매',
    icon: ArrowLeftRight,
    match: (pathname) => pathname.startsWith('/transactions'),
  },
  {
    id: 'market',
    href: '/market/analysis',
    label: '시장 분석',
    shortLabel: '시장',
    icon: LineChart,
    match: (pathname) => pathname.startsWith('/market'),
  },
  {
    id: 'tax',
    href: '/tax',
    label: '세금 정보',
    shortLabel: '세금',
    icon: Receipt,
    match: (pathname) => pathname.startsWith('/tax'),
  },
];

export const APP_BRAND = {
  name: 'SAR Portfolio',
  tagline: 'Stock Analysis Report',
};
