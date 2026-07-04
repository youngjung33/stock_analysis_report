'use client';

import { cn } from '../lib/cn';
import { AppBottomNav } from './AppBottomNav';
import { AppFooter } from './AppFooter';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';

export type AppShellMaxWidth = '3xl' | '7xl' | 'full';

const MAX_WIDTH_CLASS: Record<AppShellMaxWidth, string> = {
  '3xl': 'max-w-3xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full',
};

interface Props {
  title: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: AppShellMaxWidth;
  showNav?: boolean;
  showFooter?: boolean;
}

export function AppShell({
  title,
  subtitle,
  headerActions,
  children,
  maxWidth = '7xl',
  showNav = true,
  showFooter = true,
}: Props) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        {showNav && <AppSidebar className="hidden md:flex" />}

        <div className="flex min-h-screen flex-1 flex-col">
          <AppHeader title={title} subtitle={subtitle} actions={headerActions} />

          <main
            className={cn(
              'mx-auto w-full flex-1',
              MAX_WIDTH_CLASS[maxWidth],
              showNav && 'pb-[calc(var(--height-bottom-nav)+1.25rem)] md:pb-0',
            )}
          >
            <div
              className={cn(
                'ui-page-inner px-5 py-7 sm:px-8 sm:py-9 lg:px-10 lg:py-10',
                showNav && 'md:pb-12',
              )}
            >
              {children}
            </div>
          </main>

          {showFooter && <AppFooter className="hidden md:block" />}
        </div>
      </div>

      {showNav && <AppBottomNav className="md:hidden" />}
    </div>
  );
}
