'use client';

import { LOCALE_LABELS, type SupportedLocale } from '@sar/shared';
import { useLocale } from '@/i18n';
import { cn } from '../lib/cn';

interface Props {
  className?: string;
}

export function LanguageSelector({ className }: Props) {
  const { locale, setLocale, supportedLocales } = useLocale();

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {supportedLocales.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code as SupportedLocale)}
          className={cn(
            'rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
            locale === code
              ? 'border-primary/50 bg-primary/10 text-foreground'
              : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground',
          )}
        >
          {LOCALE_LABELS[code as SupportedLocale]}
        </button>
      ))}
    </div>
  );
}
