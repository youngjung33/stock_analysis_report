'use client';

import Link from 'next/link';

interface Props {
  username?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
  onLogout: () => void;
  active: 'dashboard' | 'transactions';
}

export function DesktopNavMenu({ username, onRefresh, refreshing, onLogout, active }: Props) {
  return (
    <nav className="flex items-center gap-3" aria-label="주 메뉴">
      {username && <span className="hidden text-sm text-slate-500 lg:inline">{username}</span>}
      {active === 'dashboard' ? (
        <Link href="/transactions" className="text-sm text-indigo-400 hover:text-indigo-300">
          거래 관리
        </Link>
      ) : (
        <Link href="/" className="text-sm text-indigo-400 hover:text-indigo-300">
          대시보드
        </Link>
      )}
      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium hover:bg-emerald-500 disabled:opacity-50"
        >
          {refreshing ? '갱신 중...' : '갱신'}
        </button>
      )}
      <button
        type="button"
        onClick={onLogout}
        className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
      >
        로그아웃
      </button>
    </nav>
  );
}
