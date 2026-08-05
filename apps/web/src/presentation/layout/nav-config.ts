import type { LucideIcon } from 'lucide-react';
import { ArrowLeftRight, BookOpen, LayoutDashboard, LineChart, Receipt, UserCircle } from 'lucide-react';

export type NavSectionId = 'dashboard' | 'my-info' | 'transactions' | 'market' | 'tax' | 'guide';

export interface AppNavItemDef {
  id: NavSectionId;
  href: string;
  labelKey: string;
  shortLabelKey: string;
  icon: LucideIcon;
  /** pathname prefix match (exact if ends without *) */
  match: (pathname: string) => boolean;
}

export const APP_NAV_ITEM_DEFS: AppNavItemDef[] = [
  {
    id: 'dashboard',
    href: '/',
    labelKey: 'nav.dashboard',
    shortLabelKey: 'nav.dashboardShort',
    icon: LayoutDashboard,
    match: (pathname) => pathname === '/' || pathname.startsWith('/stocks'),
  },
  {
    id: 'my-info',
    href: '/my-info',
    labelKey: 'nav.myInfo',
    shortLabelKey: 'nav.myInfoShort',
    icon: UserCircle,
    match: (pathname) => pathname.startsWith('/my-info'),
  },
  {
    id: 'transactions',
    href: '/transactions',
    labelKey: 'nav.transactions',
    shortLabelKey: 'nav.transactionsShort',
    icon: ArrowLeftRight,
    match: (pathname) => pathname.startsWith('/transactions'),
  },
  {
    id: 'market',
    href: '/market/analysis',
    labelKey: 'nav.market',
    shortLabelKey: 'nav.marketShort',
    icon: LineChart,
    match: (pathname) => pathname.startsWith('/market'),
  },
  {
    id: 'tax',
    href: '/tax',
    labelKey: 'nav.tax',
    shortLabelKey: 'nav.taxShort',
    icon: Receipt,
    match: (pathname) => pathname.startsWith('/tax'),
  },
  {
    id: 'guide',
    href: '/guide',
    labelKey: 'nav.guide',
    shortLabelKey: 'nav.guideShort',
    icon: BookOpen,
    match: (pathname) => pathname.startsWith('/guide'),
  },
];

export const APP_BRAND = {
  name: 'SAR Portfolio',
  tagline: 'Stock Analysis Report',
};
