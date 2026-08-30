'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { FixedLanguageSelector } from '@/presentation/components/LanguageSelector';
import { APP_BRAND } from '@/presentation/layout';
import { useResetPasswordScreen } from '../hooks/screens/useResetPasswordScreen';

function ResetPasswordForm() {
  const { t } = useTranslation();
  const screen = useResetPasswordScreen();

  return (
    <form
      onSubmit={screen.handleSubmit}
      className="mx-auto mt-8 w-full max-w-md space-y-4 rounded-xl border border-border bg-card p-6"
    >
      <h1 className="text-xl font-semibold">{t('auth.resetPasswordTitle')}</h1>
      <label className="block">
        <span className="text-sm text-muted-foreground">{t('common.newPassword')}</span>
        <input
          type="password"
          className="mt-1 w-full rounded-lg border border-border-strong bg-muted px-3 py-2"
          value={screen.password}
          onChange={(e) => screen.setPassword(e.target.value)}
        />
      </label>
      <label className="block">
        <span className="text-sm text-muted-foreground">{t('common.newPasswordConfirm')}</span>
        <input
          type="password"
          className="mt-1 w-full rounded-lg border border-border-strong bg-muted px-3 py-2"
          value={screen.passwordConfirm}
          onChange={(e) => screen.setPasswordConfirm(e.target.value)}
        />
      </label>
      <button
        type="submit"
        disabled={screen.loading}
        className="w-full rounded-lg bg-primary py-2.5 font-medium text-primary-foreground disabled:opacity-50"
      >
        {screen.loading ? t('auth.resetPasswordChanging') : t('auth.resetPasswordSubmit')}
      </button>
      <p className="text-center text-sm">
        <Link href="/login" className="text-primary hover:underline">
          {t('common.backToLogin')}
        </Link>
      </p>
    </form>
  );
}

export function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <FixedLanguageSelector />
      <p className="text-center text-lg font-semibold">{APP_BRAND.name}</p>
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
