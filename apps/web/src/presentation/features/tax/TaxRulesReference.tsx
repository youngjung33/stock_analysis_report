'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KOREAN_TAX_RULES_REFERENCE } from '@sar/shared';
import { translateTaxRule } from '@/i18n';
import { Surface } from '../../design-system';

interface Props {
  /** true면 접기 없이 항상 펼침 (세금 안내 페이지) */
  defaultOpen?: boolean;
}

export function TaxRulesReference({ defaultOpen = false }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState<boolean>(true);

  const collapsible = !defaultOpen;
  const count = KOREAN_TAX_RULES_REFERENCE.length;

  return (
    <Surface variant="section" className="space-y-4">
      {collapsible ? (
        <button
          type="button"
          className="flex w-full items-center justify-between text-left"
          onClick={() => setOpen((v) => !v)}
        >
          <div>
            <h3 className="text-base font-semibold">{t('tax.rulesReferenceTitle')}</h3>
            <p className="mt-1 text-xs text-muted-foreground md:text-sm">
              {t('tax.rulesReferenceCount', { count })}
            </p>
          </div>
          <span className="text-sm text-muted-foreground">
            {open ? t('common.collapse') : t('common.expand')}
          </span>
        </button>
      ) : (
        <div>
          <h3 className="text-base font-semibold md:text-lg">{t('tax.rulesReferenceTitle')}</h3>
          <p className="mt-1 text-xs text-muted-foreground md:text-sm">
            {t('tax.rulesReferenceSubtitle', { count })}
          </p>
        </div>
      )}

      {(defaultOpen || open) && (
        <div className="space-y-3">
          {KOREAN_TAX_RULES_REFERENCE.map((rule) => {
            const translated = translateTaxRule(rule, t);
            return (
              <article
                key={rule.id}
                className="rounded-lg border border-border bg-muted/30 px-4 py-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">
                    {translated.category}
                  </span>
                  <h4 className="text-sm font-semibold">{translated.title}</h4>
                </div>
                <p className="mt-2 text-xs text-muted-foreground md:text-sm">{translated.summary}</p>
                <dl className="mt-3 grid gap-2 text-xs md:grid-cols-3 md:text-sm">
                  <div>
                    <dt className="text-muted-foreground">{t('common.rate')}</dt>
                    <dd className="font-medium">{translated.rateLabel}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">{t('common.threshold')}</dt>
                    <dd className="font-medium">{translated.thresholdLabel}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">{t('common.filing')}</dt>
                    <dd className="font-medium">{translated.filingLabel}</dd>
                  </div>
                </dl>
                {translated.notes.length > 0 && (
                  <ul className="mt-2 list-inside list-disc text-[11px] text-muted-foreground md:text-xs">
                    {translated.notes.map((note, index) => (
                      <li key={`${rule.id}-note-${index}`}>{note}</li>
                    ))}
                  </ul>
                )}
              </article>
            );
          })}
        </div>
      )}
    </Surface>
  );
}
