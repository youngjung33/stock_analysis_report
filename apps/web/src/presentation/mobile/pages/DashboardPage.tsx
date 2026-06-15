import { useDashboardScreen } from '../../hooks/screens/useDashboardScreen';
import { MobileSummaryCards } from '../features/dashboard/SummaryCards';
import { MobileHoldingsCardList } from '../features/dashboard/HoldingsCardList';
import { MobileLayout } from '../layout/MobileLayout';

export function MobileDashboardPage() {
  const screen = useDashboardScreen();

  return (
    <MobileLayout
      title="대시보드"
      subtitle={`${screen.username}님`}
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
      {screen.refreshMessage && (
        <p className="mb-4 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300">
          {screen.refreshMessage}
        </p>
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
    </MobileLayout>
  );
}
