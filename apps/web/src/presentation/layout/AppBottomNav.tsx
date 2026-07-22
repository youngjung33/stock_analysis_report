'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useAppNavItems } from '@/i18n';
import { useActiveNavSection } from './useActiveNavSection';
import { cn } from '../lib/cn';

interface Props {
  className?: string;
}

export function AppBottomNav({ className }: Props) {
  const active = useActiveNavSection();
  const navItems = useAppNavItems();
  const { t } = useTranslation();

  return (
    <nav
      className={cn(
        'fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur-md',
        className,
      )}
      aria-label={t('nav.bottomMenu')}
    >
      <div className="grid h-(--height-bottom-nav) grid-cols-5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="size-5" aria-hidden />
              {item.shortLabel}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
