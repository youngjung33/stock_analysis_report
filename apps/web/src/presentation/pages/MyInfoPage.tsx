'use client';

import { useTranslation } from 'react-i18next';
import { CapitalAndSimulationSection } from '../components/CapitalAndSimulationSection';
import { TransactionForm } from '../features/transactions/TransactionForm';
import { TransactionList } from '../features/transactions/TransactionList';
import { MyTaxSection } from '../features/tax/MyTaxSection';
import { SummaryCards } from '../features/dashboard/SummaryCards';
import { useMyInfoScreen } from '../hooks/screens/useMyInfoScreen';
import { AppShell } from '../layout';
import { PageStack, Surface } from '../design-system';

/** 자본금·보유 종목 등록·수정 전용 페이지 */
export function MyInfoPage() {
  const screen = useMyInfoScreen();
  const { t } = useTranslation();

  return (
    <AppShell
      title={t('myInfo.title')}
      subtitle={t('myInfo.subtitle', { name: screen.displayName })}
    >
      <PageStack>
        {screen.isGuest && (
          <p className="rounded-xl border border-amber-900/40 bg-amber-950/30 px-4 py-3 text-xs text-amber-200/90 md:px-5 md:text-sm">
            {t('myInfo.guestNotice')}
          </p>
        )}

        {screen.isLoading && (
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        )}

        {screen.data && (
          <>
            <SummaryCards summary={screen.data.summary} />

            <section id="capital" className="scroll-mt-6">
              <Surface variant="section" className="mb-4 space-y-1">
                <h2 className="text-base font-semibold md:text-lg">{t('myInfo.capitalTitle')}</h2>
                <p className="text-xs text-muted-foreground md:text-sm">{t('myInfo.capitalDesc')}</p>
              </Surface>
              <CapitalAndSimulationSection onPortfolioUpdated={screen.onPortfolioUpdated} />
            </section>

            <section id="stocks" className="scroll-mt-6 space-y-5">
              <Surface variant="section" className="space-y-1">
                <h2 className="text-base font-semibold md:text-lg">{t('myInfo.tradesTitle')}</h2>
                <p className="text-xs text-muted-foreground md:text-sm">{t('myInfo.tradesDesc')}</p>
              </Surface>
              <TransactionForm onSuccess={screen.onPortfolioUpdated} />
              <div>
                <h3 className="mb-4 text-sm font-semibold text-muted-foreground md:text-base">
                  {t('myInfo.tradeHistory')}
                </h3>
                <TransactionList refreshKey={screen.refreshKey} />
              </div>
            </section>

            <section id="tax" className="scroll-mt-6 space-y-5">
              <Surface variant="section" className="space-y-1">
                <h2 className="text-base font-semibold md:text-lg">{t('myInfo.taxTitle')}</h2>
                <p className="text-xs text-muted-foreground md:text-sm">
                  {t('myInfo.taxDesc')}{' '}
                  <a href="/tax" className="text-primary underline-offset-2 hover:underline">
                    {t('myInfo.taxLink')}
                  </a>{' '}
                  {t('myInfo.taxDescSuffix')}
                </p>
              </Surface>
              <MyTaxSection refreshKey={screen.refreshKey} />
            </section>
          </>
        )}
      </PageStack>
    </AppShell>
  );
}
