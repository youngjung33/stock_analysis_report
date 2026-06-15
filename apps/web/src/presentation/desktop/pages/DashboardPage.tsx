import { useDashboardScreen } from '../../hooks/screens/useDashboardScreen';
import { DesktopSummaryCards } from '../features/dashboard/SummaryCards';
import { DesktopHoldingsTable } from '../features/dashboard/HoldingsTable';
import { DesktopLayout } from '../layout/DesktopLayout';
import { DesktopNavMenu } from '../navigation/DesktopNavMenu';

export function DesktopDashboardPage() {
  const screen = useDashboardScreen();

  return (
    <DesktopLayout
      title="포트폴리오 대시보드"
      subtitle={`${screen.username}님`}
      headerActions={
        <DesktopNavMenu
          username={screen.username ?? undefined}
          onRefresh={screen.handleRefresh}
          refreshing={screen.refreshing}
          onLogout={() => screen.logout()}
          active="dashboard"
        />
      }
    >
      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        {screen.refreshMessage && (
          <p className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300">
            {screen.refreshMessage}
          </p>
        )}

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
      </main>
    </DesktopLayout>
  );
}
