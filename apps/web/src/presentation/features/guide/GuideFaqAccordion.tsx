'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import type { GuideFaqItemDef } from '@sar/shared';
import { translateGuideFaqItem } from '@/i18n';
import { GuideFigure } from './figures/GuideFigure';
import { hasGuideFigure } from './figures/registry';
import { cn } from '../../lib/cn';

interface Props {
  item: GuideFaqItemDef;
  categoryLabel: string;
  open: boolean;
  onToggle: () => void;
  id: string;
}

export function GuideFaqAccordion({ item, categoryLabel, open, onToggle, id }: Props) {
  const { t } = useTranslation();
  const content = translateGuideFaqItem(item.id, t);

  return (
    <article
      id={id}
      className={cn(
        'scroll-mt-24 rounded-lg border border-border bg-muted/30 transition-colors',
        open && 'border-primary/30 ring-1 ring-primary/10',
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="min-w-0 flex-1">
          <span className="rounded bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
            {categoryLabel}
          </span>
          <h3 className="mt-1.5 text-sm font-semibold text-foreground sm:text-base">{content.title}</h3>
        </div>
        <span className="shrink-0 pt-1 text-xs text-muted-foreground">
          {open ? t('guide.closeItem') : t('guide.openItem')}
        </span>
      </button>

      {open && (
        <div id={`${id}-panel`} className="border-t border-border/60 px-4 pb-4 pt-3">
          <div className="space-y-2.5 text-sm leading-relaxed text-muted-foreground">
            {content.paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
          {hasGuideFigure(item.id) && (
            <GuideFigure itemId={item.id} caption={content.figureCaption} t={t} />
          )}
          {content.tips.length > 0 && (
            <ul className="mt-3 list-inside list-disc space-y-1 text-xs text-muted-foreground md:text-sm">
              {content.tips.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          )}
          {item.relatedLinks && item.relatedLinks.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="w-full text-xs font-medium text-muted-foreground">
                {t('guide.relatedLinks')}
              </span>
              {item.relatedLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-md border border-border-strong px-2.5 py-1 text-xs text-primary hover:bg-accent"
                >
                  {t(link.labelKey)}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
