'use client';

import { useTranslation } from 'react-i18next';
import {
  FOREIGN_DIVIDEND_WITHHOLDING,
  formatAmount,
  ISA_ACCOUNT_OPTIONS,
  OTHER_INCOME_BRACKETS,
  type ForeignDividendSource,
  type IsaAccountType,
  type KoreanTaxProfile,
  type OtherIncomeBracketId,
  parseAmountInput,
} from '@sar/shared';
import {
  translateForeignDividendCountry,
  translateIsaOption,
  translateOtherIncomeBracket,
} from '@/i18n';
import { AmountInput } from '../../shared/AmountInput';
import { Surface } from '../../design-system';
import { cn } from '../../lib/cn';

interface Props {
  profile: KoreanTaxProfile;
  onChange: (patch: Partial<KoreanTaxProfile>) => void;
}

const YEAR_OPTIONS = [2024, 2025, 2026, 2027];

function formatKrwInputValue(value: number): string {
  if (!value) return '';
  return formatAmount(value, { maxFractionDigits: 0 });
}

function SelectBtn({
  selected,
  onClick,
  label,
  subLabel,
  className,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  subLabel?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-lg border px-3 py-2.5 text-left text-sm transition-colors',
        selected
          ? 'border-primary/50 bg-primary/10 font-medium text-foreground'
          : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground',
        className,
      )}
    >
      <span className="block">{label}</span>
      {subLabel && <span className="mt-0.5 block text-[11px] opacity-80">{subLabel}</span>}
    </button>
  );
}

function RadioOption({
  name,
  checked,
  onChange,
  label,
  description,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  label: string;
  description?: string;
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 transition-colors',
        checked ? 'border-primary/50 bg-primary/10' : 'border-border bg-muted/30 hover:bg-muted/50',
      )}
    >
      <input
        type="radio"
        name={name}
        className="mt-1"
        checked={checked}
        onChange={onChange}
      />
      <span className="text-sm">
        <span className="font-medium">{label}</span>
        {description && (
          <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
        )}
      </span>
    </label>
  );
}

function CheckOption({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 transition-colors',
        checked ? 'border-primary/50 bg-primary/10' : 'border-border bg-muted/30 hover:bg-muted/50',
      )}
    >
      <input
        type="checkbox"
        className="mt-1"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="text-sm">
        <span className="font-medium">{label}</span>
        {description && (
          <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
        )}
      </span>
    </label>
  );
}

export function TaxProfileForm({ profile, onChange }: Props) {
  const { t, i18n } = useTranslation();
  const showForeignSource = profile.investsForeign;
  const bracketId = profile.otherIncomeBracketId ?? '14m_50m';
  const locale = i18n.language;

  return (
    <Surface variant="section" className="space-y-5">
      <div>
        <h3 className="text-base font-semibold">{t('tax.profileTitle')}</h3>
        <p className="mt-1 text-xs text-muted-foreground md:text-sm">
          {t('tax.profileDesc')}
        </p>
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-xs font-medium text-muted-foreground">{t('tax.taxYear')}</legend>
        <div className="flex flex-wrap gap-2">
          {YEAR_OPTIONS.map((y) => (
            <SelectBtn
              key={y}
              selected={profile.taxYear === y}
              onClick={() => onChange({ taxYear: y })}
              label={t('common.yearLabel', { year: y })}
              className="min-w-[4.5rem] text-center"
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-xs font-medium text-muted-foreground">{t('tax.investorType')}</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          <RadioOption
            name="investorType"
            checked={!profile.isMajorShareholder}
            onChange={() => onChange({ isMajorShareholder: false })}
            label={t('tax.investorGeneral')}
            description={t('tax.investorGeneralDesc')}
          />
          <RadioOption
            name="investorType"
            checked={profile.isMajorShareholder}
            onChange={() => onChange({ isMajorShareholder: true })}
            label={t('tax.investorMajor')}
            description={t('tax.investorMajorDesc')}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-xs font-medium text-muted-foreground">{t('tax.investMarkets')}</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          <CheckOption
            checked={profile.investsDomestic}
            onChange={(v) => onChange({ investsDomestic: v })}
            label={t('tax.investDomestic')}
            description={t('tax.investDomesticDesc')}
          />
          <CheckOption
            checked={profile.investsForeign}
            onChange={(v) => onChange({ investsForeign: v })}
            label={t('tax.investForeign')}
            description={t('tax.investForeignDesc')}
          />
        </div>
      </fieldset>

      {showForeignSource && (
        <fieldset className="space-y-2">
          <legend className="mb-2 text-xs font-medium text-muted-foreground">{t('tax.foreignDividendSource')}</legend>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {(Object.keys(FOREIGN_DIVIDEND_WITHHOLDING) as ForeignDividendSource[]).map((key) => {
              const rule = FOREIGN_DIVIDEND_WITHHOLDING[key];
              const country = translateForeignDividendCountry(key, t);
              return (
                <SelectBtn
                  key={key}
                  selected={profile.foreignDividendSource === key}
                  onClick={() => onChange({ foreignDividendSource: key })}
                  label={country.label}
                  subLabel={t('tax.localWithholdingShort', {
                    rate: `${(rule.abroadRate * 100).toFixed(1)}%`,
                  })}
                />
              );
            })}
          </div>
        </fieldset>
      )}

      <fieldset className="space-y-2">
        <legend className="mb-2 text-xs font-medium text-muted-foreground">{t('tax.isaSection')}</legend>
        <p className="text-[11px] text-muted-foreground md:text-xs">
          {t('tax.isaSectionDesc')}
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {ISA_ACCOUNT_OPTIONS.map((opt) => {
            const isa = translateIsaOption(opt.id as IsaAccountType, t);
            return (
              <SelectBtn
                key={opt.id}
                selected={profile.isaType === opt.id}
                onClick={() => onChange({ isaType: opt.id as IsaAccountType })}
                label={isa.label}
                subLabel={
                  opt.id === 'none'
                    ? isa.description
                    : t('tax.isaTaxFreeLimit', {
                        limit: (opt.taxFreeLimitKrw / 10_000).toLocaleString(locale),
                      })
                }
              />
            );
          })}
        </div>
        {profile.isaType !== 'none' && (
          <div className="mt-3 space-y-3 rounded-lg border border-border bg-muted/20 p-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                {t('tax.isaIncomeShare', { percent: profile.isaIncomeSharePercent })}
              </label>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={profile.isaIncomeSharePercent}
                onChange={(e) => onChange({ isaIncomeSharePercent: Number(e.target.value) })}
                className="w-full accent-primary"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                {t('tax.isaIncomeShareDesc')}
              </p>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                {t('tax.isaNetIncomeOverride')}
              </label>
              <AmountInput
                className="w-full max-w-md rounded-lg border border-border-strong bg-muted px-3 py-2 text-sm"
                value={formatKrwInputValue(profile.isaNetIncomeOverrideKrw)}
                onValueChange={(v) => onChange({ isaNetIncomeOverrideKrw: parseAmountInput(v) ?? 0 })}
                formatOptions={{ maxFractionDigits: 0 }}
                placeholder={t('tax.isaNetIncomePlaceholder')}
              />
            </div>
          </div>
        )}
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-xs font-medium text-muted-foreground">{t('tax.pensionSection')}</legend>
        <p className="text-[11px] text-muted-foreground md:text-xs">
          {t('tax.pensionSectionDesc')}
        </p>
        <AmountInput
          className="w-full max-w-md rounded-lg border border-border-strong bg-muted px-3 py-2 text-sm"
          value={formatKrwInputValue(profile.pensionContributionKrw)}
          onValueChange={(v) => onChange({ pensionContributionKrw: parseAmountInput(v) ?? 0 })}
          formatOptions={{ maxFractionDigits: 0 }}
          placeholder="0"
        />
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-xs font-medium text-muted-foreground">{t('tax.otherFinancialIncome')}</legend>
        <p className="text-[11px] text-muted-foreground md:text-xs">
          {t('tax.otherFinancialIncomeDesc')}
        </p>
        <AmountInput
          className="w-full max-w-md rounded-lg border border-border-strong bg-muted px-3 py-2 text-sm"
          value={formatKrwInputValue(profile.otherFinancialIncomeKrw)}
          onValueChange={(v) => onChange({ otherFinancialIncomeKrw: parseAmountInput(v) ?? 0 })}
          formatOptions={{ maxFractionDigits: 0 }}
          placeholder="0"
        />
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-xs font-medium text-muted-foreground">{t('tax.otherIncomeBracket')}</legend>
        <p className="text-[11px] text-muted-foreground md:text-xs">
          {t('tax.otherIncomeBracketDesc')}
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {OTHER_INCOME_BRACKETS.map((bracket) => {
            const translated = translateOtherIncomeBracket(bracket.id as OtherIncomeBracketId, t);
            return (
              <SelectBtn
                key={bracket.id}
                selected={bracketId === bracket.id}
                onClick={() => onChange({ otherIncomeBracketId: bracket.id as OtherIncomeBracketId })}
                label={translated.label}
                subLabel={t('tax.marginalRateLabel', { rate: translated.rateLabel })}
              />
            );
          })}
        </div>
      </fieldset>
    </Surface>
  );
}
