'use client';

import { useTranslation } from 'react-i18next';
import { type KoreanTaxEstimate } from '@sar/shared';
import { translateTaxDisclaimer, translateTaxLineItem } from '@/i18n';
import { formatNumber } from '../../shared/formatters';
import { Surface } from '../../design-system';

interface Props {
  estimate: KoreanTaxEstimate;
  usdKrwRate: number | null;
  compact?: boolean;
}

export function TaxEstimateResult({ estimate, usdKrwRate, compact = false }: Props) {
  const { t } = useTranslation();
  const displayTax =
    estimate.pensionTaxCreditKrw > 0
      ? estimate.totalEstimatedTaxAfterCreditKrw
      : estimate.totalEstimatedTaxKrw;
  const hasShelter =
    estimate.isaNetIncomeKrw > 0 || estimate.pensionTaxCreditKrw > 0;

  return (
    <div className="space-y-4">
      <Surface variant="section" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold md:text-lg">
              {compact
                ? t('tax.estimate.compactTitle')
                : t('tax.estimate.yearTitle', { year: estimate.year })}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground md:text-sm">
              {t('tax.estimate.basis')}{' '}
              {usdKrwRate
                ? t('tax.estimate.fxApplied', { rate: usdKrwRate.toLocaleString() })
                : t('tax.estimate.fxNotApplied')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-amber-300 md:text-3xl">
              {formatNumber(displayTax, 'KRW')}
            </p>
            {estimate.pensionTaxCreditKrw > 0 && (
              <p className="mt-0.5 text-[11px] text-muted-foreground md:text-xs">
                {t('tax.estimate.pensionCreditApplied', {
                  credit: formatNumber(estimate.pensionTaxCreditKrw, 'KRW'),
                  before: formatNumber(estimate.totalEstimatedTaxKrw, 'KRW'),
                })}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label={t('tax.estimate.domesticGain')}
            value={formatNumber(estimate.domesticCapitalGainKrw, 'KRW')}
            sub={
              estimate.domesticCapitalGainTaxKrw === 0
                ? t('tax.estimate.exemptGeneral')
                : t('tax.estimate.taxable')
            }
          />
          <StatCard
            label={t('tax.estimate.foreignNetGain')}
            value={formatNumber(estimate.foreignCapitalGainNetKrw, 'KRW')}
            sub={t('tax.estimate.taxableBase', {
              amount: formatNumber(estimate.foreignCapitalGainTaxableKrw, 'KRW'),
            })}
          />
          <StatCard
            label={t('tax.estimate.dividendTotal')}
            value={formatNumber(
              estimate.domesticDividendGrossKrw + estimate.foreignDividendGrossKrw,
              'KRW',
            )}
            sub={
              estimate.requiresComprehensiveTax
                ? t('tax.estimate.comprehensiveTax')
                : t('tax.estimate.separationTax')
            }
          />
          <StatCard
            label={t('tax.estimate.financialIncomeTotal')}
            value={formatNumber(estimate.totalFinancialIncomeKrw, 'KRW')}
            sub={t('tax.estimate.regularAccountThreshold')}
          />
        </div>

        {hasShelter && (
          <div className="grid gap-3 sm:grid-cols-2">
            {estimate.isaNetIncomeKrw > 0 && (
              <StatCard
                label={t('tax.estimate.isaNetIncome')}
                value={formatNumber(estimate.isaNetIncomeKrw, 'KRW')}
                sub={t('tax.estimate.isaTaxDetail', {
                  tax: formatNumber(estimate.isaTaxKrw, 'KRW'),
                  saved: formatNumber(estimate.isaTaxSavedKrw, 'KRW'),
                })}
              />
            )}
            {estimate.pensionTaxCreditKrw > 0 && (
              <StatCard
                label={t('tax.estimate.pensionCredit')}
                value={formatNumber(estimate.pensionTaxCreditKrw, 'KRW')}
                sub={t('tax.estimate.pensionCreditSub')}
              />
            )}
          </div>
        )}
      </Surface>

      {estimate.lines.length > 0 && (
        <Surface variant="section" className="overflow-x-auto">
          <h4 className="mb-3 text-sm font-semibold md:text-base">{t('tax.estimate.lineItemsTitle')}</h4>
          <table className="w-full min-w-[480px] text-left text-xs md:text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="pb-2 pr-3 font-medium">{t('common.category')}</th>
                <th className="pb-2 pr-3 font-medium">{t('common.item')}</th>
                <th className="pb-2 pr-3 text-right font-medium">{t('common.taxableBase')}</th>
                <th className="pb-2 pr-3 text-right font-medium">{t('common.rate')}</th>
                <th className="pb-2 text-right font-medium">{t('common.estimatedTax')}</th>
              </tr>
            </thead>
            <tbody>
              {estimate.lines.map((line) => {
                const localized = translateTaxLineItem(line, t);
                return (
                <tr key={line.id} className="border-b border-border/60">
                  <td className="py-2.5 pr-3 text-muted-foreground">{localized.category}</td>
                  <td className="py-2.5 pr-3">
                    {localized.label}
                    {localized.note && (
                      <span className="mt-0.5 block text-[11px] text-muted-foreground">{localized.note}</span>
                    )}
                  </td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">
                    {formatNumber(line.baseKrw, 'KRW')}
                  </td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">
                    {(line.rate * 100).toFixed(line.rate === 0 ? 0 : 1)}%
                  </td>
                  <td className="py-2.5 text-right tabular-nums font-medium">
                    {formatNumber(line.taxKrw, 'KRW')}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </Surface>
      )}

      <Surface variant="section" className="space-y-2 border-amber-900/30 bg-amber-950/20">
        <h4 className="text-sm font-semibold text-amber-200/90">{t('common.notice')}</h4>
        <ul className="list-inside list-disc space-y-1 text-[11px] text-amber-200/70 md:text-xs">
          {estimate.disclaimers.map((d, i) => (
            <li key={d}>{translateTaxDisclaimer(i, d, t)}</li>
          ))}
          <li>{t('tax.estimate.disclaimerForeignGain')}</li>
          <li>{t('tax.estimate.disclaimerComprehensive')}</li>
        </ul>
      </Surface>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
      <p className="text-[11px] text-muted-foreground md:text-xs">{label}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums md:text-base">{value}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>
    </div>
  );
}
