'use client';

import { useTranslation } from 'react-i18next';
import { FixedLanguageSelector } from '@/presentation/components/LanguageSelector';
import { APP_BRAND } from '@/presentation/layout';
import { useForgotPasswordScreen } from '../hooks/screens/useForgotPasswordScreen';
import Link from 'next/link';

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const screen = useForgotPasswordScreen();

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <FixedLanguageSelector />
      <p className="text-center text-lg font-semibold">{APP_BRAND.name}</p>
      <form
        onSubmit={screen.handleSubmit}
        className="mx-auto mt-8 w-full max-w-md space-y-4 rounded-xl border border-border bg-card p-6"
      >
        <h1 className="text-xl font-semibold">{t('auth.forgotPasswordTitle')}</h1>
        <p className="text-sm text-muted-foreground">{t('auth.forgotPasswordDesc')}</p>
        <label className="block">
          <span className="text-sm text-muted-foreground">{t('common.email')}</span>
          <input
            type="email"
            className="mt-1 w-full rounded-lg border border-border-strong bg-muted px-3 py-2"
            value={screen.email}
            onChange={(e) => screen.setEmail(e.target.value)}
            required
          />
        </label>
        <button
          type="submit"
          disabled={screen.loading}
          className="w-full rounded-lg bg-primary py-2.5 font-medium text-primary-foreground disabled:opacity-50"
        >
          {screen.loading ? t('auth.forgotPasswordSending') : t('auth.forgotPasswordSubmit')}
        </button>
        <p className="text-center text-sm">
          <Link href="/login" className="text-primary hover:underline">
            {t('common.backToLogin')}
          </Link>
        </p>
      </form>
    </div>
  );
}
