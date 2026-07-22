'use client';

import Link from 'next/link';
import { LogOut, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppNavItems } from '@/i18n';
import { LanguageSelector } from '../components/LanguageSelector';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/cn';
import { APP_BRAND } from './nav-config';
import { useActiveNavSection } from './useActiveNavSection';

interface Props {
  className?: string;
}

export function AppSidebar({ className }: Props) {
  const active = useActiveNavSection();
  const navItems = useAppNavItems();
  const { username, logout, isGuest } = useAuth();
  const { t } = useTranslation();

  return (
    <aside
      className={cn(
        'sticky top-0 flex h-screen w-(--width-sidebar) shrink-0 flex-col border-r border-border bg-sidebar',
        className,
      )}
    >
      <div className="border-b border-border px-6 py-6">
        <Link href="/" className="block">
          <span className="text-base font-semibold tracking-tight text-foreground">{APP_BRAND.name}</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">{APP_BRAND.tagline}</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1.5 px-4 py-5" aria-label={t('nav.mainMenu')}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-active text-primary'
                  : 'text-sidebar-foreground hover:bg-accent hover:text-foreground',
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-5">
        <div className="mb-4">
          <p className="mb-2 text-[11px] font-medium text-muted-foreground">{t('settings.language')}</p>
          <LanguageSelector />
        </div>
        {username && (
          <p className="mb-3 truncate text-xs text-muted-foreground">
            {username}
            {isGuest && <span className="ml-1 text-amber-400/90">{t('common.guestBadge')}</span>}
          </p>
        )}
        {!isGuest && (
          <Link
            href="/settings"
            className="mb-2 flex w-full items-center justify-center gap-2 rounded-lg border border-border-strong px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Settings className="size-4" aria-hidden />
            {t('nav.accountSettings')}
          </Link>
        )}
        <button
          type="button"
          onClick={() => logout()}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border-strong px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <LogOut className="size-4" aria-hidden />
          {t('nav.logout')}
        </button>
      </div>
    </aside>
  );
}
