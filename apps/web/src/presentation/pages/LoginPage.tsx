'use client';

import { AppErrorCode } from '@sar/shared';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FixedLanguageSelector } from '../components/LanguageSelector';
import { AuthFieldHint } from '../components/auth/AuthFormAlert';
import { OAuthLoginButtons } from '../components/auth/OAuthLoginButtons';
import { useToast } from '../components/Toast';
import { useLoginScreen } from '../hooks/screens/useLoginScreen';
import { APP_BRAND } from '../layout';

function registerFieldError(
  code: AppErrorCode | undefined,
  t: ReturnType<typeof useTranslation>['t'],
): string | undefined {
  if (!code) return undefined;
  return t(`errors.${code}`);
}

function usernameHintTone(status: ReturnType<typeof useLoginScreen>['usernameCheckStatus']) {
  if (status === 'available') return 'success' as const;
  if (status === 'unavailable') return 'error' as const;
  if (status === 'checking') return 'info' as const;
  return 'muted' as const;
}

export function LoginPage() {
  const screen = useLoginScreen();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showError } = useToast();
  const { t } = useTranslation();
  const oauthError = searchParams.get('oauthError');

  useEffect(() => {
    if (screen.isAuthenticated) {
      router.replace(screen.postAuthPath);
    }
  }, [screen.isAuthenticated, screen.postAuthPath, router]);

  useEffect(() => {
    if (!oauthError) return;
    if (oauthError === 'auth_failed') {
      showError(t('auth.oauthFailed'));
    } else {
      showError(t('auth.oauthCancelled'));
    }
  }, [oauthError, showError, t]);

  if (screen.isAuthenticated) {
    return null;
  }

  const isRegister = screen.mode === 'register';

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <FixedLanguageSelector />
      <form
        noValidate
        onSubmit={screen.handleSubmit}
        className="w-full max-w-md space-y-4 rounded-xl border border-border bg-card p-8 shadow-2xl"
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{APP_BRAND.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isRegister ? t('auth.registerSubtitle') : t('auth.loginSubtitle')}
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
            <span className="bg-card px-2 text-muted-foreground">{t('auth.orWithUsername')}</span>
          </div>
        </div>

        <label className="block">
          <span className="text-sm text-muted-foreground">{t('auth.username')}</span>
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
                {t('auth.checkDuplicate')}
              </button>
            )}
          </div>
          <AuthFieldHint
            message={
              registerFieldError(screen.fieldErrors.username, t) ||
              (isRegister
                ? screen.usernameCheckMessage || t('auth.formatHint', { hint: screen.usernameHint })
                : undefined)
            }
            tone={screen.fieldErrors.username ? 'error' : usernameHintTone(screen.usernameCheckStatus)}
          />
        </label>

        {isRegister && (
          <label className="block">
            <span className="text-sm text-muted-foreground">{t('auth.emailOptional')}</span>
            <input
              type="text"
              inputMode="email"
              className="mt-1 w-full rounded-lg border border-border-strong bg-muted px-3 py-2 text-foreground outline-none focus:border-primary"
              value={screen.email}
              onChange={(e) => screen.setEmail(e.target.value)}
              autoComplete="email"
              placeholder="name@example.com"
            />
            <AuthFieldHint message={registerFieldError(screen.fieldErrors.email, t)} tone="error" />
          </label>
        )}

        <label className="block">
          <span className="text-sm text-muted-foreground">{t('auth.password')}</span>
          <input
            type="password"
            className="mt-1 w-full rounded-lg border border-border-strong bg-muted px-3 py-2 text-foreground outline-none focus:border-primary"
            value={screen.password}
            onChange={(e) => screen.setPassword(e.target.value)}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
          />
          <AuthFieldHint
            message={registerFieldError(screen.fieldErrors.password, t) || (isRegister ? screen.passwordHint : undefined)}
            tone={screen.fieldErrors.password ? 'error' : 'muted'}
          />
        </label>

        {isRegister && (
          <label className="block">
            <span className="text-sm text-muted-foreground">{t('auth.passwordConfirm')}</span>
            <input
              type="password"
              className="mt-1 w-full rounded-lg border border-border-strong bg-muted px-3 py-2 text-foreground outline-none focus:border-primary"
              value={screen.passwordConfirm}
              onChange={(e) => screen.setPasswordConfirm(e.target.value)}
              autoComplete="new-password"
            />
            <AuthFieldHint message={registerFieldError(screen.fieldErrors.passwordConfirm, t)} tone="error" />
          </label>
        )}

        <button
          type="submit"
          disabled={screen.loading || screen.guestLoading || screen.oauthLoading}
          className="w-full rounded-lg bg-primary py-2.5 font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {screen.loading
            ? isRegister
              ? t('auth.registering')
              : t('auth.loggingIn')
            : isRegister
              ? t('auth.register')
              : t('auth.login')}
        </button>

        <p className="text-center text-sm text-muted-foreground">
          {isRegister ? t('auth.alreadyHaveAccount') : t('auth.noAccount')}{' '}
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={() => screen.setMode(isRegister ? 'login' : 'register')}
          >
            {isRegister ? t('auth.login') : t('auth.register')}
          </button>
        </p>

        {!isRegister && (
          <p className="text-center text-sm">
            <Link href="/forgot-password" className="text-muted-foreground hover:text-primary hover:underline">
              {t('auth.forgotPassword')}
            </Link>
          </p>
        )}

        <div className="rounded-xl border border-border bg-muted/50 p-4">
          <p className="text-sm font-medium">{t('auth.guestBrowseTitle')}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t('auth.guestBrowseDesc')}</p>
          <button
            type="button"
            onClick={screen.handleGuestLogin}
            disabled={screen.loading || screen.guestLoading || screen.oauthLoading}
            className="mt-3 w-full rounded-lg border border-border-strong py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
          >
            {screen.guestLoading ? t('auth.guestEntering') : t('auth.guestEnter')}
          </button>
        </div>
      </form>
    </div>
  );
}
