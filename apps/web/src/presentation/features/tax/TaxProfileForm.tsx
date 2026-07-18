'use client';

import {
  FOREIGN_DIVIDEND_WITHHOLDING,
  type ForeignDividendSource,
  type KoreanTaxProfile,
  parseAmountInput,
} from '@sar/shared';
import { AmountInput } from '../../shared/AmountInput';
import { Surface } from '../../design-system';

interface Props {
  profile: KoreanTaxProfile;
  onChange: (patch: Partial<KoreanTaxProfile>) => void;
}

const YEAR_OPTIONS = [2024, 2025, 2026, 2027];

export function TaxProfileForm({ profile, onChange }: Props) {
  return (
    <Surface variant="section" className="space-y-4">
      <div>
        <h3 className="text-base font-semibold">내 세금 정보</h3>
        <p className="mt-1 text-xs text-muted-foreground md:text-sm">
          아래 항목을 선택하면 포트폴리오 거래·배당 데이터와 합산해 추정 세액을 계산합니다.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-xs text-muted-foreground">과세 연도</span>
          <select
            className="mt-1 w-full rounded-lg border border-border-strong bg-muted px-3 py-2 text-sm"
            value={profile.taxYear}
            onChange={(e) => onChange({ taxYear: Number(e.target.value) })}
          >
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>
                {y}년
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs text-muted-foreground">해외 배당 원천지</span>
          <select
            className="mt-1 w-full rounded-lg border border-border-strong bg-muted px-3 py-2 text-sm"
            value={profile.foreignDividendSource}
            onChange={(e) =>
              onChange({ foreignDividendSource: e.target.value as ForeignDividendSource })
            }
          >
            {(Object.keys(FOREIGN_DIVIDEND_WITHHOLDING) as ForeignDividendSource[]).map((key) => (
              <option key={key} value={key}>
                {FOREIGN_DIVIDEND_WITHHOLDING[key].label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
        <input
          type="checkbox"
          className="mt-1"
          checked={profile.isMajorShareholder}
          onChange={(e) => onChange({ isMajorShareholder: e.target.checked })}
        />
        <span className="text-sm">
          <span className="font-medium">국내 대주주</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            종목당 시가총액 50억 원 이상 또는 지분 1% 이상 — 국내 상장주식 매매차익 과세
          </span>
        </span>
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-xs text-muted-foreground">기타 금융소득 (원)</span>
          <span className="block text-[11px] text-muted-foreground">예금 이자·채권 이자 등 (배당 제외)</span>
          <AmountInput
            className="mt-1 w-full rounded-lg border border-border-strong bg-muted px-3 py-2 text-sm"
            value={String(profile.otherFinancialIncomeKrw || '')}
            onValueChange={(v) => onChange({ otherFinancialIncomeKrw: parseAmountInput(v) ?? 0 })}
            formatOptions={{ maxFractionDigits: 0 }}
            placeholder="0"
          />
        </label>

        <label className="block">
          <span className="text-xs text-muted-foreground">연간 기타 소득 추정 (원)</span>
          <span className="block text-[11px] text-muted-foreground">
            근로·사업 등 — 금융소득종합과세 누진 구간 산정용
          </span>
          <AmountInput
            className="mt-1 w-full rounded-lg border border-border-strong bg-muted px-3 py-2 text-sm"
            value={String(profile.estimatedOtherIncomeKrw || '')}
            onValueChange={(v) => onChange({ estimatedOtherIncomeKrw: parseAmountInput(v) ?? 0 })}
            formatOptions={{ maxFractionDigits: 0 }}
            placeholder="50,000,000"
          />
        </label>
      </div>
    </Surface>
  );
}
