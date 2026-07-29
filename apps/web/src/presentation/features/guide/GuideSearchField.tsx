'use client';

import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/cn';

interface Props {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function GuideSearchField({ value, onChange, className }: Props) {
  const { t } = useTranslation();

  return (
    <label className={cn('block', className)}>
      <span className="sr-only">{t('guide.searchPlaceholder')}</span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('guide.searchPlaceholder')}
        className="w-full rounded-lg border border-border-strong bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
      />
    </label>
  );
}
