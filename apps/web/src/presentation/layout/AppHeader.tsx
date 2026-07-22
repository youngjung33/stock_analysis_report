'use client';

import Link from 'next/link';
import { LogOut, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/cn';

interface Props {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
  showMobileLogout?: boolean;
}

export function AppHeader({ title, subtitle, actions, className, showMobileLogout = true }: Props) {
  const { logout, isGuest } = useAuth();
  const { t } = useTranslation();

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md',
        className,
      )}
    >
      <div className="ui-shell-header-inner flex h-(--height-header) items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold tracking-tight md:text-xl">{title}</h1>
          {subtitle && (
            <p className="truncate text-xs text-muted-foreground md:text-sm">{subtitle}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {actions}
          {!isGuest && (
            <Link
              href="/settings"
              className="rounded-lg border border-border-strong p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden"
              aria-label={t('nav.accountSettings')}
            >
              <Settings className="size-4" />
            </Link>
          )}
          {showMobileLogout && (
            <button
              type="button"
              onClick={() => logout()}
              className="rounded-lg border border-border-strong p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden"
              aria-label={t('nav.logout')}
            >
              <LogOut className="size-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
