'use client';

import { useTaxScreen } from '../../hooks/screens/useTaxScreen';
import { TaxProfileForm } from './TaxProfileForm';
import { TaxRulesReference } from './TaxRulesReference';
import { TaxEstimateResult } from './TaxEstimateResult';

interface Props {
  refreshKey?: number;
}

export function TaxSection({ refreshKey = 0 }: Props) {
  const screen = useTaxScreen(refreshKey);

  return (
    <div className="space-y-6">
      <TaxRulesReference />
      <TaxProfileForm profile={screen.profile} onChange={screen.updateProfile} />

      {screen.loading && (
        <p className="text-sm text-muted-foreground">거래·배당 데이터 불러오는 중...</p>
      )}

      {!screen.loading && screen.estimate && (
        <TaxEstimateResult estimate={screen.estimate} usdKrwRate={screen.usdKrwRate} />
      )}

      {!screen.loading && screen.estimate && screen.estimate.lines.length === 0 && (
        <p className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          {screen.profile.taxYear}년에 해당하는 매도·배당 내역이 없습니다. 거래·기업행위(배당)를
          등록하면 추정 세액이 표시됩니다.
        </p>
      )}
    </div>
  );
}
