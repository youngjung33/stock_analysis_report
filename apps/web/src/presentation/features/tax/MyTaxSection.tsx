'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const screen = useTaxScreen(refreshKey);

  return (
    <div className="space-y-6">
      <TaxProfileForm profile={screen.profile} onChange={screen.updateProfile} />
      <ApplicableTaxSummary profile={screen.profile} estimate={screen.estimate} />

      {screen.loading && (
        <p className="text-sm text-muted-foreground">{t('tax.loadingEstimate')}</p>
      )}

      {!screen.loading && screen.estimate && (
        <TaxEstimateResult estimate={screen.estimate} usdKrwRate={screen.usdKrwRate} compact />
      )}

      {!screen.loading && screen.estimate && screen.estimate.lines.length === 0 && (
        <Surface variant="section" className="text-sm text-muted-foreground">
          {t('tax.noTransactions', { year: screen.profile.taxYear })}
        </Surface>
      )}

      <p className="text-center text-xs text-muted-foreground">
        {t('tax.guideLinkHint')}{' '}
        <Link href="/tax" className="text-primary underline-offset-2 hover:underline">
          {t('tax.guideLink')}
        </Link>
        {t('tax.guideLinkSuffix')}
      </p>
    </div>
  );
}
