'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useLoginScreen } from '../../hooks/screens/useLoginScreen';
import { APP_BRAND } from '../../layout';

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
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <form
        onSubmit={screen.handleSubmit}
        className="w-full max-w-md space-y-4 rounded-xl border border-border bg-card p-8 shadow-2xl"
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{APP_BRAND.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">로그인 후 거래와 시세를 관리하세요.</p>
        </div>

        {screen.error && <p className="text-sm text-danger">{screen.error}</p>}

        <label className="block">
          <span className="text-sm text-muted-foreground">아이디</span>
          <input
            className="mt-1 w-full rounded-lg border border-border-strong bg-muted px-3 py-2 text-foreground outline-none focus:border-primary"
            value={screen.username}
            onChange={(e) => screen.setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </label>

        <label className="block">
          <span className="text-sm text-muted-foreground">비밀번호</span>
          <input
            type="password"
            className="mt-1 w-full rounded-lg border border-border-strong bg-muted px-3 py-2 text-foreground outline-none focus:border-primary"
            value={screen.password}
            onChange={(e) => screen.setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        <button
          type="submit"
          disabled={screen.loading || screen.guestLoading}
          className="w-full rounded-lg bg-primary py-2.5 font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {screen.loading ? '로그인 중...' : '로그인'}
        </button>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-card px-2 text-muted-foreground">또는</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-muted/50 p-4">
          <p className="text-sm font-medium">비회원으로 둘러보기</p>
          <p className="mt-1 text-xs text-muted-foreground">
            서버에 저장되지 않으며, 이 브라우저 탭을 닫으면 데이터가 사라집니다.
          </p>
          <button
            type="button"
            onClick={screen.handleGuestLogin}
            disabled={screen.loading || screen.guestLoading}
            className="mt-3 w-full rounded-lg border border-border-strong py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
          >
            {screen.guestLoading ? '입장 중...' : '비회원으로 입장'}
          </button>
        </div>
      </form>
    </div>
  );
}
