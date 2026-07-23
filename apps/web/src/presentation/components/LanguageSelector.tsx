'use client';

import { LOCALE_LABELS, type SupportedLocale } from '@sar/shared';
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/i18n';
import { cn } from '../lib/cn';

interface Props {
  className?: string;
  variant?: 'default' | 'compact';
}

export function LanguageSelector({ className, variant = 'default' }: Props) {
  const { locale, setLocale, supportedLocales } = useLocale();
  const { t } = useTranslation();
  const compact = variant === 'compact';

  return (
    <div
      className={cn('flex flex-wrap gap-1.5', className)}
      role="group"
      aria-label={t('settings.language')}
    >
      {supportedLocales.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code as SupportedLocale)}
          aria-pressed={locale === code}
          className={cn(
            'border font-medium transition-colors',
            compact
              ? 'rounded-md px-2.5 py-1 text-xs'
              : 'rounded-lg px-4 py-2 text-sm',
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

/** 로그인·비밀번호 찾기 등 인증 화면 — 우측 상단 고정 */
export function FixedLanguageSelector() {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-end p-4 sm:p-5">
      <div className="pointer-events-auto rounded-lg border border-border/80 bg-card/95 p-1 shadow-sm backdrop-blur-sm">
        <LanguageSelector variant="compact" />
      </div>
    </div>
  );
}
