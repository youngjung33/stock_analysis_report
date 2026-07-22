'use client';

import { usePathname } from 'next/navigation';
import { APP_NAV_ITEM_DEFS, type NavSectionId } from './nav-config';

export function useActiveNavSection(): NavSectionId | null {
  const pathname = usePathname();
  const item = APP_NAV_ITEM_DEFS.find((nav) => nav.match(pathname));
  return item?.id ?? null;
}
