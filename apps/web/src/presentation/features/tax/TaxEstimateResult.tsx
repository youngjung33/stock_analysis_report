'use client';

import { FINANCIAL_INCOME_THRESHOLD_KRW, type KoreanTaxEstimate } from '@sar/shared';
import { formatNumber } from '../../shared/formatters';
import { Surface } from '../../design-system';

interface Props {
  estimate: KoreanTaxEstimate;
  usdKrwRate: number | null;
  compact?: boolean;
}

export function TaxEstimateResult({ estimate, usdKrwRate, compact = false }: Props) {
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
              {compact ? '보유·매매 기반 추정 세액' : `${estimate.year}년 추정 세금`}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground md:text-sm">
              등록된 거래·배당 기준 · 환율{' '}
              {usdKrwRate ? `₩${usdKrwRate.toLocaleString('ko-KR')}/USD` : '미적용'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-amber-300 md:text-3xl">
              {formatNumber(displayTax, 'KRW')}
            </p>
            {estimate.pensionTaxCreditKrw > 0 && (
              <p className="mt-0.5 text-[11px] text-muted-foreground md:text-xs">
                연금 세액공제 {formatNumber(estimate.pensionTaxCreditKrw, 'KRW')} 반영
                · 공제 전 {formatNumber(estimate.totalEstimatedTaxKrw, 'KRW')}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="국내 매매차익"
            value={formatNumber(estimate.domesticCapitalGainKrw, 'KRW')}
            sub={estimate.domesticCapitalGainTaxKrw === 0 ? '비과세 (일반)' : '과세'}
          />
          <StatCard
            label="해외 순매매차익"
            value={formatNumber(estimate.foreignCapitalGainNetKrw, 'KRW')}
            sub={`과세표준 ${formatNumber(estimate.foreignCapitalGainTaxableKrw, 'KRW')}`}
          />
          <StatCard
            label="배당 (국내+해외)"
            value={formatNumber(
              estimate.domesticDividendGrossKrw + estimate.foreignDividendGrossKrw,
              'KRW',
            )}
            sub={
              estimate.requiresComprehensiveTax
                ? '종합과세 대상 (일반 계좌)'
                : '분리과세 (15.4% 등)'
            }
          />
          <StatCard
            label="금융소득 합계"
            value={formatNumber(estimate.totalFinancialIncomeKrw, 'KRW')}
            sub={`일반 계좌 · 기준 ${(FINANCIAL_INCOME_THRESHOLD_KRW / 10_000).toLocaleString('ko-KR')}만 원`}
          />
        </div>

        {hasShelter && (
          <div className="grid gap-3 sm:grid-cols-2">
            {estimate.isaNetIncomeKrw > 0 && (
              <StatCard
                label="ISA 순소득"
                value={formatNumber(estimate.isaNetIncomeKrw, 'KRW')}
                sub={`ISA 세금 ${formatNumber(estimate.isaTaxKrw, 'KRW')} · 절세 추정 ${formatNumber(estimate.isaTaxSavedKrw, 'KRW')}`}
              />
            )}
            {estimate.pensionTaxCreditKrw > 0 && (
              <StatCard
                label="연금저축 세액공제"
                value={formatNumber(estimate.pensionTaxCreditKrw, 'KRW')}
                sub="납입 공제 (추정)"
              />
            )}
          </div>
        )}
      </Surface>

      {estimate.lines.length > 0 && (
        <Surface variant="section" className="overflow-x-auto">
          <h4 className="mb-3 text-sm font-semibold md:text-base">세목별 내역</h4>
          <table className="w-full min-w-[480px] text-left text-xs md:text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="pb-2 pr-3 font-medium">구분</th>
                <th className="pb-2 pr-3 font-medium">항목</th>
                <th className="pb-2 pr-3 text-right font-medium">과세표준</th>
                <th className="pb-2 pr-3 text-right font-medium">세율</th>
                <th className="pb-2 text-right font-medium">추정 세액</th>
              </tr>
            </thead>
            <tbody>
              {estimate.lines.map((line) => (
                <tr key={line.id} className="border-b border-border/60">
                  <td className="py-2.5 pr-3 text-muted-foreground">{line.category}</td>
                  <td className="py-2.5 pr-3">
                    {line.label}
                    {line.note && (
                      <span className="mt-0.5 block text-[11px] text-muted-foreground">{line.note}</span>
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
              ))}
            </tbody>
          </table>
        </Surface>
      )}

      <Surface variant="section" className="space-y-2 border-amber-900/30 bg-amber-950/20">
        <h4 className="text-sm font-semibold text-amber-200/90">안내</h4>
        <ul className="list-inside list-disc space-y-1 text-[11px] text-amber-200/70 md:text-xs">
          {estimate.disclaimers.map((d) => (
            <li key={d}>{d}</li>
          ))}
          <li>해외주식 양도세는 다음 해 5월 1~31일 확정신고·납부 대상입니다.</li>
          <li>배당·금융소득 2,000만 원 초과 시 5월 종합소득세 신고가 필요합니다.</li>
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
