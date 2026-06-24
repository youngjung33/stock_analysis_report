import { useDashboardScreen } from '../../hooks/screens/useDashboardScreen';
import { MarketStatusBanner } from '../../components/MarketStatusBanner';
import { QuoteRefreshNoticeBox } from '../../components/QuoteRefreshNoticeBox';
import { MarketSentimentSummarySection } from '../../components/MarketSentimentSummarySection';
import { FeaturedQuotesSection } from '../../components/FeaturedQuotesSection';
import { DesktopSummaryCards } from '../features/dashboard/SummaryCards';
import { DesktopHoldingsTable } from '../features/dashboard/HoldingsTable';
import { DesktopLayout } from '../layout/DesktopLayout';
import { DesktopNavMenu } from '../navigation/DesktopNavMenu';

export function DesktopDashboardPage() {
  const screen = useDashboardScreen();

  return (
    <DesktopLayout
      title="포트폴리오 대시보드"
      subtitle={`${screen.displayName}님`}
      headerActions={
        <DesktopNavMenu
          username={screen.displayName ?? undefined}
          onRefresh={screen.handleRefresh}
          refreshing={screen.refreshing}
          onLogout={() => screen.logout()}
          active="dashboard"
        />
      }
    >
      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        {screen.isGuest && (
          <p className="rounded-lg border border-amber-900/50 bg-amber-950/40 px-4 py-2 text-sm text-amber-200/90">
            비회원 모드입니다. 거래 데이터는 서버에 저장되지 않으며, 탭을 닫으면 사라집니다.
          </p>
        )}

        {!screen.marketStatusLoading && screen.marketProviders.length > 0 && (
          <MarketStatusBanner providers={screen.marketProviders} />
        )}

        {screen.refreshNotice && <QuoteRefreshNoticeBox notice={screen.refreshNotice} />}

        {screen.data?.lastRefreshedAt && (
          <p className="text-sm text-slate-500">
            마지막 갱신: {new Date(screen.data.lastRefreshedAt).toLocaleString('ko-KR')}
          </p>
        )}

        {screen.isLoading && <p className="text-slate-400">대시보드 로딩 중...</p>}
        {screen.error && <p className="text-rose-400">대시보드를 불러오지 못했습니다.</p>}

        {screen.data && (
          <>
            <DesktopSummaryCards summary={screen.data.summary} />
            <DesktopHoldingsTable holdings={screen.data.holdings} />
          </>
        )}

        <MarketSentimentSummarySection />
        <FeaturedQuotesSection />
      </main>
    </DesktopLayout>
  );
}
