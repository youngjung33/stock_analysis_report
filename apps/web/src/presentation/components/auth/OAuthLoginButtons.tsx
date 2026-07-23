'use client';

import { useTranslation } from 'react-i18next';
import { OAuthProviderMeta } from '@sar/shared';

interface Props {
  providers: OAuthProviderMeta[];
  loading?: boolean;
  disabled?: boolean;
  onProviderClick: (providerId: OAuthProviderMeta['id']) => void;
}

/** 공식 브랜드 가이드 기반 SSO 로그인 버튼 */
export function OAuthLoginButtons({
  providers,
  loading,
  disabled,
  onProviderClick,
}: Props) {
  const { t } = useTranslation();

  if (loading) {
    return <p className="text-center text-xs text-muted-foreground">{t('auth.oauthLoading')}</p>;
  }

  if (providers.length === 0) {
    return (
      <p className="text-center text-xs text-muted-foreground">
        {t('auth.oauthNotConfigured')}
      </p>
    );
  }

  return (
    <div className="grid gap-2">
      {providers.map((provider) => (
        <button
          key={provider.id}
          type="button"
          disabled={disabled}
          onClick={() => onProviderClick(provider.id)}
          className="flex h-11 w-full items-center justify-center rounded-lg border border-border bg-background transition hover:bg-accent disabled:opacity-50"
          aria-label={t(`auth.oauth.signIn.${provider.id}`)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- OAuth 공식 버튼 에셋 URL */}
          <img
            src={provider.signInButtonSrc}
            alt={t(`auth.oauth.signIn.${provider.id}`)}
            className="h-10 w-auto max-w-full object-contain"
            loading="lazy"
          />
        </button>
      ))}
    </div>
  );
}
