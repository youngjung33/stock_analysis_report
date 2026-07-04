import { useDashboardScreen } from '../../hooks/screens/useDashboardScreen';
import { MarketStatusBanner } from '../../components/MarketStatusBanner';
import { QuoteRefreshNoticeBox } from '../../components/QuoteRefreshNoticeBox';
import { MarketSentimentSummarySection } from '../../components/MarketSentimentSummarySection';
import { FeaturedQuotesSection } from '../../components/FeaturedQuotesSection';
import { MobileSummaryCards } from '../features/dashboard/SummaryCards';
import { MobileHoldingsCardList } from '../features/dashboard/HoldingsCardList';
import { AllocationSection } from '../../components/AllocationSection';
import {
  BenchmarkComparisonRow,
  PeriodReturnsCard,
  PortfolioInsightsSection,
} from '../../components/PortfolioAnalysisSections';
import { WatchlistSection } from '../../components/WatchlistSection';
import { usePortfolioAnalysis } from '../../hooks/usePortfolioAnalysis';
import { AppShell, RefreshQuotesButton } from '../../layout';
import { PageStack } from '../../design-system';

export function MobileDashboardPage() {
  const screen = useDashboardScreen();
  const analysis = usePortfolioAnalysis();

  return (
    <AppShell
      title="대시보드"
      subtitle={`${screen.displayName}님`}
      headerActions={
        <RefreshQuotesButton
          compact
          onClick={screen.handleRefresh}
          loading={screen.refreshing}
        />
      }
    >
      <PageStack>
        {screen.isGuest && (
          <p className="rounded-xl border border-amber-900/40 bg-amber-950/30 px-4 py-3 text-xs text-amber-200/90">
            비회원 모드 — 탭을 닫으면 데이터가 사라집니다.
          </p>
        )}

        {!screen.marketStatusLoading && screen.marketProviders.length > 0 && (
          <MarketStatusBanner providers={screen.marketProviders} />
        )}

        {screen.refreshNotice && <QuoteRefreshNoticeBox notice={screen.refreshNotice} />}

        {screen.data?.lastRefreshedAt && (
          <p className="text-xs text-muted-foreground">
            마지막 갱신: {new Date(screen.data.lastRefreshedAt).toLocaleString('ko-KR')}
          </p>
        )}

        {screen.isLoading && <p className="text-sm text-muted-foreground">대시보드 로딩 중...</p>}
        {screen.error && <p className="text-sm text-danger">대시보드를 불러오지 못했습니다.</p>}

        {screen.data && (
          <>
            <MobileSummaryCards summary={screen.data.summary} />
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
            <MobileHoldingsCardList holdings={screen.data.holdings} />
            <PeriodReturnsCard analysis={analysis.data} isLoading={analysis.isLoading} />
            <BenchmarkComparisonRow analysis={analysis.data} />
            <PortfolioInsightsSection analysis={analysis.data} isLoading={analysis.isLoading} />
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
