import { useDashboardScreen } from '../../hooks/screens/useDashboardScreen';
import { MarketStatusBanner } from '../../components/MarketStatusBanner';
import { QuoteRefreshNoticeBox } from '../../components/QuoteRefreshNoticeBox';
import { MarketSentimentSummarySection } from '../../components/MarketSentimentSummarySection';
import { FeaturedQuotesSection } from '../../components/FeaturedQuotesSection';
import { MobileSummaryCards } from '../features/dashboard/SummaryCards';
import { MobileHoldingsCardList } from '../features/dashboard/HoldingsCardList';
import { MobileLayout } from '../layout/MobileLayout';

export function MobileDashboardPage() {
  const screen = useDashboardScreen();

  return (
    <MobileLayout
      title="대시보드"
      subtitle={`${screen.displayName}님`}
      onLogout={() => screen.logout()}
      headerActions={
        <button
          type="button"
          onClick={screen.handleRefresh}
          disabled={screen.refreshing}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium hover:bg-emerald-500 disabled:opacity-50"
        >
          {screen.refreshing ? '갱신 중' : '갱신'}
        </button>
      }
    >
      {screen.isGuest && (
        <p className="mb-4 rounded-lg border border-amber-900/50 bg-amber-950/40 px-3 py-2 text-xs text-amber-200/90">
          비회원 모드 — 탭을 닫으면 데이터가 사라집니다.
        </p>
      )}

      {!screen.marketStatusLoading && screen.marketProviders.length > 0 && (
        <div className="mb-4">
          <MarketStatusBanner providers={screen.marketProviders} />
        </div>
      )}

      {screen.refreshNotice && (
        <div className="mb-4">
          <QuoteRefreshNoticeBox notice={screen.refreshNotice} />
        </div>
      )}

      {screen.data?.lastRefreshedAt && (
        <p className="mb-4 text-xs text-slate-500">
          마지막 갱신: {new Date(screen.data.lastRefreshedAt).toLocaleString('ko-KR')}
        </p>
      )}

      {screen.isLoading && <p className="text-sm text-slate-400">대시보드 로딩 중...</p>}
      {screen.error && <p className="text-sm text-rose-400">대시보드를 불러오지 못했습니다.</p>}

      {screen.data && (
        <div className="space-y-4">
          <MobileSummaryCards summary={screen.data.summary} />
          <MobileHoldingsCardList holdings={screen.data.holdings} />
        </div>
      )}

      <div className="mt-6 space-y-6">
        <MarketSentimentSummarySection compact />
        <FeaturedQuotesSection compact />
      </div>
    </MobileLayout>
  );
}
