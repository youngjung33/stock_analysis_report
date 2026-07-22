'use client';

import { useTranslation } from 'react-i18next';
import { MarketAnalysisDetailSection } from '../components/MarketAnalysisDetailSection';
import { AppShell } from '../layout';

export function MarketAnalysisPage() {
  const { t } = useTranslation();

  return (
    <AppShell title={t('market.detailTitle')} subtitle={t('market.detailSubtitle')}>
      <MarketAnalysisDetailSection compact />
    </AppShell>
  );
}
