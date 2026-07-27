'use client';

import { Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { THEME_MODES, THEME_LABELS, type ThemeMode } from '@sar/shared';
import { useTheme } from '@/theme';
import { cn } from '../lib/cn';

interface Props {
  className?: string;
  variant?: 'icon' | 'segmented';
}

export function ThemeToggle({ className, variant = 'icon' }: Props) {
  const { theme, setTheme, toggleTheme } = useTheme();
  const { t } = useTranslation();

  if (variant === 'segmented') {
    return (
      <div
        className={cn('flex flex-wrap gap-1.5', className)}
        role="group"
        aria-label={t('settings.theme')}
      >
        {THEME_MODES.map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setTheme(mode as ThemeMode)}
            aria-pressed={theme === mode}
            className={cn(
              'rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
              theme === mode
                ? 'border-primary/50 bg-primary/10 text-foreground'
                : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground',
            )}
          >
            {t(`settings.theme${mode === 'light' ? 'Light' : 'Dark'}`, {
              defaultValue: THEME_LABELS[mode],
            })}
          </button>
        ))}
      </div>
    );
  }

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? t('settings.themeLight') : t('settings.themeDark')}
      aria-pressed={isDark}
      className={cn(
        'rounded-lg border border-border-strong p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
        className,
      )}
    >
      {isDark ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
    </button>
  );
}
