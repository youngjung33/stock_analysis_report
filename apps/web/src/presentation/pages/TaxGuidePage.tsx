'use client';

import {
  FINANCIAL_INCOME_THRESHOLD_KRW,
  CAPITAL_GAINS_BASIC_DEDUCTION_KRW,
  FOREIGN_DIVIDEND_WITHHOLDING,
  ISA_ACCOUNT_OPTIONS,
  KOREAN_INCOME_TAX_BRACKETS,
  KOREAN_TAX_RULES_REFERENCE,
  PENSION_SAVINGS_CREDIT_RATE,
} from '@sar/shared';
import { Surface } from '../design-system';
import { TaxRulesReference } from '../features/tax/TaxRulesReference';

export function TaxGuidePage() {
  return (
    <div className="space-y-8">
      <Surface variant="section" className="space-y-2 border-indigo-900/30 bg-indigo-950/20">
        <h2 className="text-lg font-semibold md:text-xl">한국 거주자 주식 세금 안내</h2>
        <p className="text-sm text-muted-foreground">
          2026년 기준 국세청·소득세법 참고 요약입니다. 실제 신고·납부는 국세청·세무 전문가 확인이
          필요합니다.
        </p>
        <ul className="list-inside list-disc text-xs text-muted-foreground md:text-sm">
          <li>금융투자소득세(금투세)는 2026년 기준 미시행·폐지 논의 중</li>
          <li>해외주식 양도세 — 다음 해 5월 1~31일 확정신고</li>
          <li>금융소득(이자+배당) {(FINANCIAL_INCOME_THRESHOLD_KRW / 10_000).toLocaleString('ko-KR')}만 원 초과 시 종합과세</li>
        </ul>
      </Surface>

      <TaxRulesReference defaultOpen />

      <Surface variant="section" className="space-y-4">
        <h3 className="text-base font-semibold">세제혜택 계좌 (ISA·연금저축)</h3>
        <p className="text-sm text-muted-foreground">
          ISA(개인종합자산관리계좌)는 계좌 내 손익통산 후 순소득에 대해 비과세 한도를 적용하고,
          초과분은 9.9% 분리과세합니다. ISA로 과세된 소득은 금융소득종합과세(2,000만 원) 합산에서
          제외됩니다.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-xs md:text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">유형</th>
                <th className="pb-2 pr-4 font-medium">비과세 한도</th>
                <th className="pb-2 font-medium">초과분</th>
              </tr>
            </thead>
            <tbody>
              {ISA_ACCOUNT_OPTIONS.filter((o) => o.id !== 'none').map((opt) => (
                <tr key={opt.id} className="border-b border-border/60">
                  <td className="py-2.5 pr-4 font-medium">{opt.label}</td>
                  <td className="py-2.5 pr-4 tabular-nums">
                    {(opt.taxFreeLimitKrw / 10_000).toLocaleString('ko-KR')}만 원/년
                  </td>
                  <td className="py-2.5 text-muted-foreground">9.9% 분리과세</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted-foreground">
          연금저축 납입은 근로소득자에게 납입액의 {(PENSION_SAVINGS_CREDIT_RATE * 100).toFixed(1)}%
          세액공제(연 600만 원 한도)가 적용됩니다. 본 앱 추정에서는 배당·매매 세금과 별도로
          표시합니다.
        </p>
      </Surface>

      <Surface variant="section" className="space-y-4">
        <h3 className="text-base font-semibold">국가별 해외 배당 원천징수</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-xs md:text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">국가</th>
                <th className="pb-2 pr-4 font-medium">현지 원천징수</th>
                <th className="pb-2 pr-4 font-medium">국내 추가</th>
                <th className="pb-2 font-medium">비고</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(FOREIGN_DIVIDEND_WITHHOLDING).map(([key, rule]) => (
                <tr key={key} className="border-b border-border/60">
                  <td className="py-2.5 pr-4 font-medium">{rule.label}</td>
                  <td className="py-2.5 pr-4 tabular-nums">{(rule.abroadRate * 100).toFixed(2)}%</td>
                  <td className="py-2.5 pr-4 tabular-nums">
                    {rule.additionalKrRate > 0
                      ? `${(rule.additionalKrRate * 100).toFixed(1)}%`
                      : '없음 (조세조약)'}
                  </td>
                  <td className="py-2.5 text-muted-foreground">{rule.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Surface>

      <Surface variant="section" className="space-y-4">
        <h3 className="text-base font-semibold">양도소득 기본공제</h3>
        <p className="text-sm text-muted-foreground">
          해외주식·국내 대주주 양도소득 — 연간{' '}
          <strong>{(CAPITAL_GAINS_BASIC_DEDUCTION_KRW / 10_000).toLocaleString('ko-KR')}만 원</strong>
          (국내·해외 합산 1회). 일반 투자자의 국내 상장주식 매매차익은 비과세입니다.
        </p>
      </Surface>

      <Surface variant="section" className="space-y-4">
        <h3 className="text-base font-semibold">종합소득세 누진 구간 (금융소득종합과세)</h3>
        <p className="text-sm text-muted-foreground">
          금융소득 {(FINANCIAL_INCOME_THRESHOLD_KRW / 10_000).toLocaleString('ko-KR')}만 원 초과 시
          이자·배당 전액이 다른 소득과 합산되어 아래 구간별 세율(+ 지방세 10%)이 적용됩니다.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[360px] text-left text-xs md:text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">과세표준 구간</th>
                <th className="pb-2 font-medium">세율</th>
              </tr>
            </thead>
            <tbody>
              {KOREAN_INCOME_TAX_BRACKETS.map((b) => (
                <tr key={b.label} className="border-b border-border/60">
                  <td className="py-2.5 pr-4">{b.label}</td>
                  <td className="py-2.5 tabular-nums">{(b.rate * 100).toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Surface>

      <Surface variant="section" className="space-y-3">
        <h3 className="text-base font-semibold">신고 일정 요약</h3>
        <dl className="grid gap-3 text-sm md:grid-cols-2">
          {KOREAN_TAX_RULES_REFERENCE.filter((r) => r.filingLabel !== '신고 불필요').map((rule) => (
            <div key={rule.id} className="rounded-lg border border-border bg-muted/30 px-4 py-3">
              <dt className="text-xs text-muted-foreground">{rule.category}</dt>
              <dd className="font-medium">{rule.title}</dd>
              <dd className="mt-1 text-xs text-muted-foreground">{rule.filingLabel}</dd>
            </div>
          ))}
        </dl>
      </Surface>
    </div>
  );
}
