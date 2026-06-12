import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getErrorMessage } from '../../domain/errors/app-error';
import { useAuth } from '../hooks/useAuth';
import { useDashboard } from '../hooks/useDashboard';
import { SummaryCards } from '../components/SummaryCards';
import { HoldingsTable } from '../components/HoldingsTable';

export function DashboardPage() {
  const { username, logout } = useAuth();
  const { data, isLoading, error, refresh } = useDashboard();
  const [refreshMessage, setRefreshMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    setRefreshMessage('');
    try {
      const result = await refresh();
      const failMsg =
        result.failed.length > 0
          ? ` (실패 ${result.failed.length}건: ${result.failed.map((f) => f.symbol).join(', ')})`
          : '';
      setRefreshMessage(`${result.updated}개 종목 시세 갱신 완료${failMsg}`);
    } catch (err) {
      setRefreshMessage(getErrorMessage(err, '시세 갱신에 실패했습니다.'));
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-bold">포트폴리오 대시보드</h1>
            <p className="text-sm text-slate-400">{username}님</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/transactions" className="text-sm text-indigo-400 hover:text-indigo-300">
              거래 관리
            </Link>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium hover:bg-emerald-500 disabled:opacity-50"
            >
              {refreshing ? '갱신 중...' : '갱신'}
            </button>
            <button
              onClick={() => logout()}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8">
        {refreshMessage && (
          <p className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300">
            {refreshMessage}
          </p>
        )}

        {data?.lastRefreshedAt && (
          <p className="text-sm text-slate-500">
            마지막 갱신: {new Date(data.lastRefreshedAt).toLocaleString('ko-KR')}
          </p>
        )}

        {isLoading && <p className="text-slate-400">대시보드 로딩 중...</p>}
        {error && <p className="text-rose-400">대시보드를 불러오지 못했습니다.</p>}

        {data && (
          <>
            <SummaryCards summary={data.summary} />
            <HoldingsTable holdings={data.holdings} />
          </>
        )}
      </main>
    </div>
  );
}
