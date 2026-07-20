'use client';

import { isPortfolioEmpty } from '@sar/shared';
import { useDashboardScreen } from '../hooks/screens/useDashboardScreen';
import { PageStack } from '../design-system';
import { PortfolioOnboardingSection } from '../features/onboarding/PortfolioOnboardingSection';
import { CapitalAndSimulationSection } from '../components/CapitalAndSimulationSection';
import { MarketStatusBanner } from '../components/MarketStatusBanner';
import { QuoteRefreshNoticeBox } from '../components/QuoteRefreshNoticeBox';
import { MarketSentimentSummarySection } from '../components/MarketSentimentSummarySection';
import { FeaturedQuotesSection } from '../components/FeaturedQuotesSection';
import { SummaryCards } from '../features/dashboard/SummaryCards';
import { HoldingsSection } from '../features/dashboard/HoldingsSection';
import { AllocationSection } from '../components/AllocationSection';
import {
  BenchmarkComparisonRow,
  PeriodReturnsCard,
  PortfolioInsightsSection,
} from '../components/PortfolioAnalysisSections';
import { WatchlistSection } from '../components/WatchlistSection';
import { usePortfolioAnalysis } from '../hooks/usePortfolioAnalysis';
import { AppShell, RefreshQuotesButton } from '../layout';

/** responsive 단일 대시보드 페이지 */
export function DashboardPage() {
  const screen = useDashboardScreen();
  const analysis = usePortfolioAnalysis();
  const showOnboarding =
    screen.data != null && isPortfolioEmpty(screen.data.summary);

  return (
    <AppShell
      title="투자 현황"
      subtitle={`${screen.displayName}님`}
      headerActions={
        <RefreshQuotesButton compact onClick={screen.handleRefresh} loading={screen.refreshing} />
      }
    >
      <PageStack>
        {screen.isGuest && (
          <p className="rounded-xl border border-amber-900/40 bg-amber-950/30 px-4 py-3 text-xs text-amber-200/90 md:px-5 md:text-sm">
            비회원 모드입니다. 매매 데이터는 서버에 저장되지 않으며, 탭을 닫으면 사라집니다.
          </p>
        )}

        {!screen.marketStatusLoading && screen.marketProviders.length > 0 && (
          <MarketStatusBanner providers={screen.marketProviders} />
        )}

        {screen.refreshNotice && <QuoteRefreshNoticeBox notice={screen.refreshNotice} />}

        {screen.data?.lastRefreshedAt && (
          <p className="text-xs text-muted-foreground md:text-sm">
            마지막 갱신: {new Date(screen.data.lastRefreshedAt).toLocaleString('ko-KR')}
          </p>
        )}

        {screen.isLoading && (
          <p className="text-sm text-muted-foreground md:text-base">투자 현황 불러오는 중...</p>
        )}

        {screen.data && (
          <>
            {showOnboarding && <PortfolioOnboardingSection isGuest={screen.isGuest} />}

            <SummaryCards summary={screen.data.summary} />

            {!showOnboarding && (
              <>
                <CapitalAndSimulationSection onPortfolioUpdated={screen.refreshDashboard} />

                <AllocationSection
                  items={screen.data.holdings
                    .filter((h) => h.weightPercent !== null && h.marketValueKrw !== null)
                    .map((h) => ({
                      symbol: h.symbol,
                      name: h.name,
                      market: h.market,
                      marketValueKrw: h.marketValueKrw as number,
                      weightPercent: h.weightPercent as number,
                    }))}
                  allocationByMarket={screen.data.summary.allocationByMarket}
                />

                <HoldingsSection holdings={screen.data.holdings} />

                <PeriodReturnsCard analysis={analysis.data} isLoading={analysis.isLoading} />
                <BenchmarkComparisonRow analysis={analysis.data} />
                <PortfolioInsightsSection analysis={analysis.data} isLoading={analysis.isLoading} />
              </>
            )}

            <WatchlistSection
              holdingSymbols={screen.data.holdings.map((h) => ({
                symbol: h.symbol,
                market: h.market,
              }))}
            />
          </>
        )}

        <MarketSentimentSummarySection compact />
        <FeaturedQuotesSection compact />
      </PageStack>
    </AppShell>
  );
}
