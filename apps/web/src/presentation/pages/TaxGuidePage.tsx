'use client';

import { useTranslation } from 'react-i18next';
import {
  FOREIGN_DIVIDEND_WITHHOLDING,
  ISA_ACCOUNT_OPTIONS,
  KOREAN_INCOME_TAX_BRACKETS,
  KOREAN_TAX_RULES_REFERENCE,
  OTHER_INCOME_BRACKETS,
  type IsaAccountType,
  type OtherIncomeBracketId,
} from '@sar/shared';
import {
  translateForeignDividendCountry,
  translateIsaOption,
  translateOtherIncomeBracket,
  translateTaxRule,
} from '@/i18n';
import { Surface } from '../design-system';
import { TaxRulesReference } from '../features/tax/TaxRulesReference';

export function TaxGuidePage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;

  return (
    <div className="space-y-8">
      <Surface variant="section" className="space-y-2 border-indigo-900/30 bg-indigo-950/20">
        <h2 className="text-lg font-semibold md:text-xl">{t('tax.guideTitle')}</h2>
        <p className="text-sm text-muted-foreground">{t('tax.guideIntro')}</p>
        <ul className="list-inside list-disc text-xs text-muted-foreground md:text-sm">
          <li>{t('tax.guide.bulletFinancialTax')}</li>
          <li>{t('tax.guide.bulletForeignGain')}</li>
          <li>{t('tax.guide.bulletComprehensive')}</li>
        </ul>
      </Surface>

      <TaxRulesReference defaultOpen />

      <Surface variant="section" className="space-y-4">
        <h3 className="text-base font-semibold">{t('tax.guide.shelterAccountsTitle')}</h3>
        <p className="text-sm text-muted-foreground">{t('tax.guide.shelterAccountsDesc')}</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-xs md:text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">{t('common.accountType')}</th>
                <th className="pb-2 pr-4 font-medium">{t('common.taxFreeLimit')}</th>
                <th className="pb-2 font-medium">{t('common.overflow')}</th>
              </tr>
            </thead>
            <tbody>
              {ISA_ACCOUNT_OPTIONS.filter((o) => o.id !== 'none').map((opt) => {
                const isa = translateIsaOption(opt.id as IsaAccountType, t);
                return (
                  <tr key={opt.id} className="border-b border-border/60">
                    <td className="py-2.5 pr-4 font-medium">{isa.label}</td>
                    <td className="py-2.5 pr-4 tabular-nums">
                      {t('tax.guide.taxFreeLimitPerYear', {
                        limit: (opt.taxFreeLimitKrw / 10_000).toLocaleString(locale),
                      })}
                    </td>
                    <td className="py-2.5 text-muted-foreground">{t('tax.guide.isaOverflowRate')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted-foreground">{t('tax.guide.pensionCreditDesc')}</p>
      </Surface>

      <Surface variant="section" className="space-y-4">
        <h3 className="text-base font-semibold">{t('tax.guide.foreignDividendTitle')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-xs md:text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">{t('common.country')}</th>
                <th className="pb-2 pr-4 font-medium">{t('common.localWithholding')}</th>
                <th className="pb-2 pr-4 font-medium">{t('common.domesticAdditional')}</th>
                <th className="pb-2 font-medium">{t('common.remarks')}</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(FOREIGN_DIVIDEND_WITHHOLDING).map(([key, rule]) => {
                const country = translateForeignDividendCountry(key, t);
                return (
                  <tr key={key} className="border-b border-border/60">
                    <td className="py-2.5 pr-4 font-medium">{country.label}</td>
                    <td className="py-2.5 pr-4 tabular-nums">{(rule.abroadRate * 100).toFixed(2)}%</td>
                    <td className="py-2.5 pr-4 tabular-nums">
                      {rule.additionalKrRate > 0
                        ? `${(rule.additionalKrRate * 100).toFixed(1)}%`
                        : t('common.noneApplicable')}
                    </td>
                    <td className="py-2.5 text-muted-foreground">{country.note}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Surface>

      <Surface variant="section" className="space-y-4">
        <h3 className="text-base font-semibold">{t('tax.guide.capitalDeductionTitle')}</h3>
        <p className="text-sm text-muted-foreground">{t('tax.guide.capitalDeductionDesc')}</p>
      </Surface>

      <Surface variant="section" className="space-y-4">
        <h3 className="text-base font-semibold">{t('tax.guide.incomeTaxBracketsTitle')}</h3>
        <p className="text-sm text-muted-foreground">{t('tax.guide.incomeTaxBracketsDesc')}</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[360px] text-left text-xs md:text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">{t('common.taxBracket')}</th>
                <th className="pb-2 font-medium">{t('common.taxRate')}</th>
              </tr>
            </thead>
            <tbody>
              {KOREAN_INCOME_TAX_BRACKETS.map((bracket) => {
                const match = OTHER_INCOME_BRACKETS.find((b) => b.label === bracket.label);
                const label = match
                  ? translateOtherIncomeBracket(match.id as OtherIncomeBracketId, t).label
                  : bracket.label;
                return (
                  <tr key={bracket.label} className="border-b border-border/60">
                    <td className="py-2.5 pr-4">{label}</td>
                    <td className="py-2.5 tabular-nums">{(bracket.rate * 100).toFixed(0)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Surface>

      <Surface variant="section" className="space-y-3">
        <h3 className="text-base font-semibold">{t('tax.guide.filingScheduleTitle')}</h3>
        <dl className="grid gap-3 text-sm md:grid-cols-2">
          {KOREAN_TAX_RULES_REFERENCE.filter((r) => r.id !== 'kr-capital-general').map((rule) => {
            const translated = translateTaxRule(rule, t);
            return (
              <div key={rule.id} className="rounded-lg border border-border bg-muted/30 px-4 py-3">
                <dt className="text-xs text-muted-foreground">{translated.category}</dt>
                <dd className="font-medium">{translated.title}</dd>
                <dd className="mt-1 text-xs text-muted-foreground">{translated.filingLabel}</dd>
              </div>
            );
          })}
        </dl>
      </Surface>
    </div>
  );
}
