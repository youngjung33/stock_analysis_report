'use client';

import Link from 'next/link';
import { useActiveNavSection } from './useActiveNavSection';
import { cn } from '../lib/cn';
import { APP_NAV_ITEMS } from './nav-config';

interface Props {
  className?: string;
}

export function AppBottomNav({ className }: Props) {
  const active = useActiveNavSection();

  return (
    <nav
      className={cn(
        'fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur-md',
        className,
      )}
      aria-label="하단 메뉴"
    >
      <div className="grid h-(--height-bottom-nav) grid-cols-5">
        {APP_NAV_ITEMS.map((item) => {
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
