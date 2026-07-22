'use client';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { APP_NAV_ITEM_DEFS, type AppNavItemDef } from '../presentation/layout/nav-config';

export interface AppNavItem extends AppNavItemDef {
  label: string;
  shortLabel: string;
}

export function useAppNavItems(): AppNavItem[] {
  const { t } = useTranslation();

  return useMemo(
    () =>
      APP_NAV_ITEM_DEFS.map((item) => ({
        ...item,
        label: t(item.labelKey),
        shortLabel: t(item.shortLabelKey),
      })),
    [t],
  );
}
