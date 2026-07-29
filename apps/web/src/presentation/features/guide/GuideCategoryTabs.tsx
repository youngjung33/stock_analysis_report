'use client';

import { useTranslation } from 'react-i18next';
import { GUIDE_CATEGORIES, type GuideCategoryId } from '@sar/shared';
import { translateGuideCategory } from '@/i18n';
import { cn } from '../../lib/cn';

interface Props {
  value: GuideCategoryId | 'all';
  onChange: (value: GuideCategoryId | 'all') => void;
  className?: string;
}

export function GuideCategoryTabs({ value, onChange, className }: Props) {
  const { t } = useTranslation();

  return (
    <div
      className={cn('flex flex-wrap gap-1.5', className)}
      role="tablist"
      aria-label={t('guide.title')}
    >
      <button
        type="button"
        role="tab"
        aria-selected={value === 'all'}
        onClick={() => onChange('all')}
        className={cn(
          'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm',
          value === 'all'
            ? 'border-primary/50 bg-primary/10 text-foreground'
            : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground',
        )}
      >
        {t('guide.allCategories')}
      </button>
      {GUIDE_CATEGORIES.map((cat) => {
        const translated = translateGuideCategory(cat.id, t);
        return (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={value === cat.id}
            onClick={() => onChange(cat.id)}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm',
              value === cat.id
                ? 'border-primary/50 bg-primary/10 text-foreground'
                : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground',
            )}
          >
            {translated.label}
          </button>
        );
      })}
    </div>
  );
}
