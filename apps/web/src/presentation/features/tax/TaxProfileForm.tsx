'use client';

import {
  FOREIGN_DIVIDEND_WITHHOLDING,
  formatAmount,
  ISA_ACCOUNT_OPTIONS,
  OTHER_INCOME_BRACKETS,
  PENSION_SAVINGS_ANNUAL_LIMIT_KRW,
  type ForeignDividendSource,
  type IsaAccountType,
  type KoreanTaxProfile,
  type OtherIncomeBracketId,
  parseAmountInput,
} from '@sar/shared';
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
  const showForeignSource = profile.investsForeign;
  const bracketId = profile.otherIncomeBracketId ?? '14m_50m';

  return (
    <Surface variant="section" className="space-y-5">
      <div>
        <h3 className="text-base font-semibold">내 세금 조건</h3>
        <p className="mt-1 text-xs text-muted-foreground md:text-sm">
          본인 상황을 선택하면 적용되는 세목과 보유·매매 기반 추정 세액을 확인할 수 있습니다.
        </p>
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-xs font-medium text-muted-foreground">과세 연도</legend>
        <div className="flex flex-wrap gap-2">
          {YEAR_OPTIONS.map((y) => (
            <SelectBtn
              key={y}
              selected={profile.taxYear === y}
              onClick={() => onChange({ taxYear: y })}
              label={`${y}년`}
              className="min-w-[4.5rem] text-center"
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-xs font-medium text-muted-foreground">투자자 유형</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          <RadioOption
            name="investorType"
            checked={!profile.isMajorShareholder}
            onChange={() => onChange({ isMajorShareholder: false })}
            label="일반 투자자"
            description="코스피·코스닥 매매차익 비과세"
          />
          <RadioOption
            name="investorType"
            checked={profile.isMajorShareholder}
            onChange={() => onChange({ isMajorShareholder: true })}
            label="국내 대주주"
            description="시총 50억+ 또는 지분 1%+ — 매매차익 과세"
          />
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-xs font-medium text-muted-foreground">투자 시장</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          <CheckOption
            checked={profile.investsDomestic}
            onChange={(v) => onChange({ investsDomestic: v })}
            label="국내 주식 (KR)"
            description="배당·증권거래세·국내 규정"
          />
          <CheckOption
            checked={profile.investsForeign}
            onChange={(v) => onChange({ investsForeign: v })}
            label="해외 주식 (US 등)"
            description="양도소득세·해외 배당"
          />
        </div>
      </fieldset>

      {showForeignSource && (
        <fieldset className="space-y-2">
          <legend className="mb-2 text-xs font-medium text-muted-foreground">해외 배당 원천지</legend>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {(Object.keys(FOREIGN_DIVIDEND_WITHHOLDING) as ForeignDividendSource[]).map((key) => {
              const rule = FOREIGN_DIVIDEND_WITHHOLDING[key];
              return (
                <SelectBtn
                  key={key}
                  selected={profile.foreignDividendSource === key}
                  onClick={() => onChange({ foreignDividendSource: key })}
                  label={rule.label}
                  subLabel={`현지 ${(rule.abroadRate * 100).toFixed(1)}%`}
                />
              );
            })}
          </div>
        </fieldset>
      )}

      <fieldset className="space-y-2">
        <legend className="mb-2 text-xs font-medium text-muted-foreground">세제혜택 계좌 (ISA)</legend>
        <p className="text-[11px] text-muted-foreground md:text-xs">
          ISA 계좌 내 순소득은 비과세 한도·9.9% 분리과세로 별도 계산됩니다. 거래를 ISA/일반으로
          구분하지 않았다면 비율로 나눕니다.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {ISA_ACCOUNT_OPTIONS.map((opt) => (
            <SelectBtn
              key={opt.id}
              selected={profile.isaType === opt.id}
              onClick={() => onChange({ isaType: opt.id as IsaAccountType })}
              label={opt.label}
              subLabel={opt.id === 'none' ? opt.description : `비과세 ${(opt.taxFreeLimitKrw / 10_000).toLocaleString('ko-KR')}만 원`}
            />
          ))}
        </div>
        {profile.isaType !== 'none' && (
          <div className="mt-3 space-y-3 rounded-lg border border-border bg-muted/20 p-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                ISA 소득 비율 ({profile.isaIncomeSharePercent}%)
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
                배당·매매·기타 금융소득 중 ISA 계좌 비율 (직접 입력이 있으면 아래 값 우선)
              </p>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                ISA 순소득 직접 입력 (원, 선택)
              </label>
              <AmountInput
                className="w-full max-w-md rounded-lg border border-border-strong bg-muted px-3 py-2 text-sm"
                value={formatKrwInputValue(profile.isaNetIncomeOverrideKrw)}
                onValueChange={(v) => onChange({ isaNetIncomeOverrideKrw: parseAmountInput(v) ?? 0 })}
                formatOptions={{ maxFractionDigits: 0 }}
                placeholder="비율로 자동 추정"
              />
            </div>
          </div>
        )}
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-xs font-medium text-muted-foreground">연금저축 납입 (세액공제)</legend>
        <p className="text-[11px] text-muted-foreground md:text-xs">
          근로소득자 연금저축 납입액 — 연 {(PENSION_SAVINGS_ANNUAL_LIMIT_KRW / 10_000).toLocaleString('ko-KR')}만
          원 한도, 13.2% 세액공제 추정
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
        <legend className="mb-2 text-xs font-medium text-muted-foreground">기타 금융소득 (원)</legend>
        <p className="text-[11px] text-muted-foreground md:text-xs">
          예금 이자·채권 이자 등 (배당 제외)
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
        <legend className="mb-2 text-xs font-medium text-muted-foreground">연간 기타 소득 (근로·사업)</legend>
        <p className="text-[11px] text-muted-foreground md:text-xs">
          종합소득세 누진 구간 산정용 — 해당하는 구간을 선택하세요
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {OTHER_INCOME_BRACKETS.map((bracket) => (
            <SelectBtn
              key={bracket.id}
              selected={bracketId === bracket.id}
              onClick={() => onChange({ otherIncomeBracketId: bracket.id as OtherIncomeBracketId })}
              label={bracket.label}
              subLabel={`한계세율 ${bracket.rateLabel} (+ 지방세)`}
            />
          ))}
        </div>
      </fieldset>
    </Surface>
  );
}
