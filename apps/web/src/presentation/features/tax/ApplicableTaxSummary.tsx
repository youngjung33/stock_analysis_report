'use client';

import Link from 'next/link';
import {
  resolveApplicableTaxRules,
  type ApplicableTaxRule,
  type ApplicableTaxStatus,
  type KoreanTaxEstimate,
  type KoreanTaxProfile,
} from '@sar/shared';
import { Surface } from '../../design-system';
import { cn } from '../../lib/cn';

interface Props {
  profile: KoreanTaxProfile;
  estimate: KoreanTaxEstimate | null;
}

const STATUS_LABEL: Record<ApplicableTaxStatus, string> = {
  applies: '적용',
  exempt: '비과세',
  conditional: '조건부',
  not_applicable: '해당 없음',
};

const STATUS_CLASS: Record<ApplicableTaxStatus, string> = {
  applies: 'border-emerald-800/50 bg-emerald-950/30 text-emerald-300',
  exempt: 'border-slate-600 bg-slate-900/50 text-slate-300',
  conditional: 'border-amber-800/50 bg-amber-950/30 text-amber-200',
  not_applicable: 'border-border bg-muted/20 text-muted-foreground',
};

export function ApplicableTaxSummary({ profile, estimate }: Props) {
  const rules = resolveApplicableTaxRules(profile, estimate);
  const active = rules.filter((r) => r.status !== 'not_applicable');

  return (
    <Surface variant="section" className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">나에게 적용되는 세금</h3>
          <p className="mt-1 text-xs text-muted-foreground md:text-sm">
            선택한 조건 기준 {active.length}개 세목 · 전체 기준은{' '}
            <Link href="/tax" className="text-primary underline-offset-2 hover:underline">
              세금 정보
            </Link>
            에서 확인
          </p>
        </div>
      </div>

      <ul className="space-y-2">
        {rules.map((item) => (
          <ApplicableTaxCard key={item.ruleId} item={item} />
        ))}
      </ul>
    </Surface>
  );
}

function ApplicableTaxCard({ item }: { item: ApplicableTaxRule }) {
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
          {STATUS_LABEL[item.status]}
        </span>
        <span className="text-[11px] text-muted-foreground">{item.rule.category}</span>
        <h4 className="text-sm font-semibold">{item.rule.title}</h4>
      </div>
      <p className="mt-1.5 text-xs">{item.reason}</p>
      {item.status !== 'not_applicable' && (
        <p className="mt-1 text-[11px] opacity-80">
          세율 {item.rule.rateLabel} · {item.rule.filingLabel}
        </p>
      )}
    </li>
  );
}
