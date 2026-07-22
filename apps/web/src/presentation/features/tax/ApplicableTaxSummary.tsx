'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import {
  FOREIGN_DIVIDEND_WITHHOLDING,
  resolveIsaTaxFreeLimit,
  resolveApplicableTaxRules,
  type ApplicableTaxRule,
  type ApplicableTaxStatus,
  type KoreanTaxEstimate,
  type KoreanTaxProfile,
} from '@sar/shared';
import {
  translateApplicableTaxReason,
  translateApplicableTaxStatus,
  translateForeignDividendCountry,
  translateTaxRule,
} from '@/i18n';
import { Surface } from '../../design-system';
import { cn } from '../../lib/cn';

interface Props {
  profile: KoreanTaxProfile;
  estimate: KoreanTaxEstimate | null;
}

const STATUS_CLASS: Record<ApplicableTaxStatus, string> = {
  applies: 'border-emerald-800/50 bg-emerald-950/30 text-emerald-300',
  exempt: 'border-slate-600 bg-slate-900/50 text-slate-300',
  conditional: 'border-amber-800/50 bg-amber-950/30 text-amber-200',
  not_applicable: 'border-border bg-muted/20 text-muted-foreground',
};

function buildReasonParams(
  item: ApplicableTaxRule,
  profile: KoreanTaxProfile,
  t: ReturnType<typeof useTranslation>['t'],
  locale: string,
): Record<string, string | number> | undefined {
  if (item.ruleId === 'us-dividend') {
    const rule = FOREIGN_DIVIDEND_WITHHOLDING[profile.foreignDividendSource];
    const country = translateForeignDividendCountry(profile.foreignDividendSource, t).label;
    const localRate = t('tax.localWithholdingShort', {
      rate: `${(rule.abroadRate * 100).toFixed(1)}%`,
    });
    const withholding =
      rule.additionalKrRate > 0
        ? `${localRate} + ${t('common.domesticAdditional')} ${(rule.additionalKrRate * 100).toFixed(1)}%`
        : `${localRate} ${t('common.noneApplicable').match(/\(.+\)/)?.[0] ?? ''}`.trim();
    return { country, withholding };
  }

  if (item.ruleId === 'isa-account' && item.status === 'applies') {
    const limit = resolveIsaTaxFreeLimit(profile.isaType);
    return { limit: (limit / 10_000).toLocaleString(locale) };
  }

  if (item.ruleId === 'pension-savings' && item.status === 'applies') {
    return { amount: profile.pensionContributionKrw.toLocaleString(locale) };
  }

  return undefined;
}

export function ApplicableTaxSummary({ profile, estimate }: Props) {
  const { t } = useTranslation();
  const rules = resolveApplicableTaxRules(profile, estimate);
  const active = rules.filter((r) => r.status !== 'not_applicable');

  return (
    <Surface variant="section" className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">{t('tax.applicableTitle')}</h3>
          <p className="mt-1 text-xs text-muted-foreground md:text-sm">
            {t('tax.applicableDesc', { count: active.length })}{' '}
            <Link href="/tax" className="text-primary underline-offset-2 hover:underline">
              {t('tax.applicableDescLink')}
            </Link>
            {t('tax.applicableDescSuffix')}
          </p>
        </div>
      </div>

      <ul className="space-y-2">
        {rules.map((item) => (
          <ApplicableTaxCard key={item.ruleId} item={item} profile={profile} />
        ))}
      </ul>
    </Surface>
  );
}

function ApplicableTaxCard({
  item,
  profile,
}: {
  item: ApplicableTaxRule;
  profile: KoreanTaxProfile;
}) {
  const { t, i18n } = useTranslation();
  const rule = translateTaxRule(item.rule, t);
  const reasonParams = buildReasonParams(item, profile, t, i18n.language);
  const reason = translateApplicableTaxReason(
    item.ruleId,
    item.status,
    t,
    item.reason,
    reasonParams,
  );

  return (
    <li
      className={cn(
        'rounded-lg border px-4 py-3',
        STATUS_CLASS[item.status],
        item.status === 'not_applicable' && 'opacity-60',
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded bg-black/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">
          {translateApplicableTaxStatus(item.status, t)}
        </span>
        <span className="text-[11px] text-muted-foreground">{rule.category}</span>
        <h4 className="text-sm font-semibold">{rule.title}</h4>
      </div>
      <p className="mt-1.5 text-xs">{reason}</p>
      {item.status !== 'not_applicable' && (
        <p className="mt-1 text-[11px] opacity-80">
          {t('tax.applicableRateFiling', { rate: rule.rateLabel, filing: rule.filingLabel })}
        </p>
      )}
    </li>
  );
}
