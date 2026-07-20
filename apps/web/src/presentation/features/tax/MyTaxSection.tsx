'use client';

import Link from 'next/link';
import { useTaxScreen } from '../../hooks/screens/useTaxScreen';
import { TaxProfileForm } from './TaxProfileForm';
import { ApplicableTaxSummary } from './ApplicableTaxSummary';
import { TaxEstimateResult } from './TaxEstimateResult';
import { Surface } from '../../design-system';

interface Props {
  refreshKey?: number;
}

/** 내 정보 — 조건 선택 + 적용 세목 + 추정 세액 */
export function MyTaxSection({ refreshKey = 0 }: Props) {
  const screen = useTaxScreen(refreshKey);

  return (
    <div className="space-y-6">
      <TaxProfileForm profile={screen.profile} onChange={screen.updateProfile} />
      <ApplicableTaxSummary profile={screen.profile} estimate={screen.estimate} />

      {screen.loading && (
        <p className="text-sm text-muted-foreground">거래·배당 데이터 불러오는 중...</p>
      )}

      {!screen.loading && screen.estimate && (
        <TaxEstimateResult estimate={screen.estimate} usdKrwRate={screen.usdKrwRate} compact />
      )}

      {!screen.loading && screen.estimate && screen.estimate.lines.length === 0 && (
        <Surface variant="section" className="text-sm text-muted-foreground">
          {screen.profile.taxYear}년 매도·배당 내역이 없습니다. 거래·배당·분할·합병을 등록하면 추정
          세액이 표시됩니다.
        </Surface>
      )}

      <p className="text-center text-xs text-muted-foreground">
        세금 기준 전체·국가별 배당·누진세 구간은{' '}
        <Link href="/tax" className="text-primary underline-offset-2 hover:underline">
          세금 정보
        </Link>
        를 참고하세요.
      </p>
    </div>
  );
}
