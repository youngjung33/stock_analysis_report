'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useLoginScreen } from '../../hooks/screens/useLoginScreen';

export function DesktopLoginPage() {
  const screen = useLoginScreen();
  const router = useRouter();

  useEffect(() => {
    if (screen.isAuthenticated) {
      router.replace('/');
    }
  }, [screen.isAuthenticated, router]);

  if (screen.isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
      <form
        onSubmit={screen.handleSubmit}
        className="w-full max-w-md space-y-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-xl"
      >
        <h1 className="text-2xl font-bold text-white">포트폴리오 대시보드</h1>
        <p className="text-sm text-slate-400">로그인 후 거래와 시세를 관리하세요.</p>

        {screen.error && <p className="text-sm text-rose-400">{screen.error}</p>}

        <label className="block">
          <span className="text-sm text-slate-400">아이디</span>
          <input
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            value={screen.username}
            onChange={(e) => screen.setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </label>

        <label className="block">
          <span className="text-sm text-slate-400">비밀번호</span>
          <input
            type="password"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            value={screen.password}
            onChange={(e) => screen.setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        <button
          type="submit"
          disabled={screen.loading || screen.guestLoading}
          className="w-full rounded-lg bg-indigo-600 py-2 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {screen.loading ? '로그인 중...' : '로그인'}
        </button>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-slate-900/80 px-2 text-slate-500">또는</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
          <p className="text-sm font-medium text-slate-200">비회원으로 둘러보기</p>
          <p className="mt-1 text-xs text-slate-500">
            서버에 저장되지 않으며, 이 브라우저 탭을 닫으면 데이터가 사라집니다.
          </p>
          <button
            type="button"
            onClick={screen.handleGuestLogin}
            disabled={screen.loading || screen.guestLoading}
            className="mt-3 w-full rounded-lg border border-slate-700 py-2 text-sm font-medium text-slate-200 hover:border-slate-600 hover:bg-slate-900 disabled:opacity-50"
          >
            {screen.guestLoading ? '입장 중...' : '비회원으로 입장'}
          </button>
        </div>
      </form>
    </div>
  );
}
