'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { AuthFieldHint } from '../../components/auth/AuthFormAlert';
import { OAuthLoginButtons } from '../../components/auth/OAuthLoginButtons';
import { useToast } from '../../components/Toast';
import { useLoginScreen } from '../../hooks/screens/useLoginScreen';
import { APP_BRAND } from '../../layout';

function usernameHintTone(status: ReturnType<typeof useLoginScreen>['usernameCheckStatus']) {
  if (status === 'available') return 'success' as const;
  if (status === 'unavailable') return 'error' as const;
  if (status === 'checking') return 'info' as const;
  return 'muted' as const;
}

export function DesktopLoginPage() {
  const screen = useLoginScreen();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showError } = useToast();
  const oauthError = searchParams.get('oauthError');

  useEffect(() => {
    if (screen.isAuthenticated) {
      router.replace(screen.postAuthPath);
    }
  }, [screen.isAuthenticated, screen.postAuthPath, router]);

  useEffect(() => {
    if (!oauthError) return;
    if (oauthError === 'auth_failed') {
      showError('소셜 로그인에 실패했습니다.');
    } else {
      showError('소셜 로그인이 취소되었습니다.');
    }
  }, [oauthError, showError]);

  if (screen.isAuthenticated) {
    return null;
  }

  const isRegister = screen.mode === 'register';

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <form
        noValidate
        onSubmit={screen.handleSubmit}
        className="w-full max-w-md space-y-4 rounded-xl border border-border bg-card p-8 shadow-2xl"
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{APP_BRAND.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isRegister ? '회원가입 후 포트폴리오를 관리하세요.' : '로그인 후 거래와 시세를 관리하세요.'}
          </p>
        </div>

        <OAuthLoginButtons
          providers={screen.oauthProviders}
          loading={screen.providersLoading}
          disabled={screen.loading || screen.guestLoading || screen.oauthLoading}
          onProviderClick={screen.handleOAuthLogin}
        />

        <div className="relative py-1">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-card px-2 text-muted-foreground">또는 아이디로</span>
          </div>
        </div>

        <label className="block">
          <span className="text-sm text-muted-foreground">아이디</span>
          <div className="mt-1 flex gap-2">
            <input
              className="min-w-0 flex-1 rounded-lg border border-border-strong bg-muted px-3 py-2 text-foreground outline-none focus:border-primary"
              value={screen.username}
              onChange={(e) => screen.setUsername(e.target.value)}
              onBlur={isRegister ? screen.checkUsernameAvailability : undefined}
              autoComplete="username"
            />
            {isRegister && (
              <button
                type="button"
                onClick={screen.checkUsernameAvailability}
                disabled={screen.loading || screen.usernameCheckStatus === 'checking'}
                className="shrink-0 rounded-lg border border-border-strong px-3 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
              >
                중복 확인
              </button>
            )}
          </div>
          <AuthFieldHint
            message={
              screen.fieldErrors.username ||
              (isRegister
                ? screen.usernameCheckMessage || `형식: ${screen.usernameHint}`
                : undefined)
            }
            tone={screen.fieldErrors.username ? 'error' : usernameHintTone(screen.usernameCheckStatus)}
          />
        </label>

        {isRegister && (
          <label className="block">
            <span className="text-sm text-muted-foreground">이메일 (선택)</span>
            <input
              type="text"
              inputMode="email"
              className="mt-1 w-full rounded-lg border border-border-strong bg-muted px-3 py-2 text-foreground outline-none focus:border-primary"
              value={screen.email}
              onChange={(e) => screen.setEmail(e.target.value)}
              autoComplete="email"
              placeholder="name@example.com"
            />
            <AuthFieldHint message={screen.fieldErrors.email} tone="error" />
          </label>
        )}

        <label className="block">
          <span className="text-sm text-muted-foreground">비밀번호</span>
          <input
            type="password"
            className="mt-1 w-full rounded-lg border border-border-strong bg-muted px-3 py-2 text-foreground outline-none focus:border-primary"
            value={screen.password}
            onChange={(e) => screen.setPassword(e.target.value)}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
          />
          <AuthFieldHint
            message={screen.fieldErrors.password || (isRegister ? screen.passwordHint : undefined)}
            tone={screen.fieldErrors.password ? 'error' : 'muted'}
          />
        </label>

        {isRegister && (
          <label className="block">
            <span className="text-sm text-muted-foreground">비밀번호 확인</span>
            <input
              type="password"
              className="mt-1 w-full rounded-lg border border-border-strong bg-muted px-3 py-2 text-foreground outline-none focus:border-primary"
              value={screen.passwordConfirm}
              onChange={(e) => screen.setPasswordConfirm(e.target.value)}
              autoComplete="new-password"
            />
            <AuthFieldHint message={screen.fieldErrors.passwordConfirm} tone="error" />
          </label>
        )}

        <button
          type="submit"
          disabled={screen.loading || screen.guestLoading || screen.oauthLoading}
          className="w-full rounded-lg bg-primary py-2.5 font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {screen.loading
            ? isRegister
              ? '가입 중...'
              : '로그인 중...'
            : isRegister
              ? '회원가입'
              : '로그인'}
        </button>

        <p className="text-center text-sm text-muted-foreground">
          {isRegister ? '이미 계정이 있으신가요?' : '계정이 없으신가요?'}{' '}
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={() => screen.setMode(isRegister ? 'login' : 'register')}
          >
            {isRegister ? '로그인' : '회원가입'}
          </button>
        </p>

        {!isRegister && (
          <p className="text-center text-sm">
            <Link href="/forgot-password" className="text-muted-foreground hover:text-primary hover:underline">
              비밀번호를 잊으셨나요?
            </Link>
          </p>
        )}

        <div className="rounded-xl border border-border bg-muted/50 p-4">
          <p className="text-sm font-medium">비회원으로 둘러보기</p>
          <p className="mt-1 text-xs text-muted-foreground">
            서버에 저장되지 않으며, 이 브라우저 탭을 닫으면 데이터가 사라집니다.
          </p>
          <button
            type="button"
            onClick={screen.handleGuestLogin}
            disabled={screen.loading || screen.guestLoading || screen.oauthLoading}
            className="mt-3 w-full rounded-lg border border-border-strong py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
          >
            {screen.guestLoading ? '입장 중...' : '비회원으로 입장'}
          </button>
        </div>
      </form>
    </div>
  );
}
