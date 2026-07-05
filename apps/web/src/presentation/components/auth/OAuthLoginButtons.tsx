'use client';

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
  if (loading) {
    return <p className="text-center text-xs text-muted-foreground">소셜 로그인 불러오는 중...</p>;
  }

  if (providers.length === 0) {
    return (
      <p className="text-center text-xs text-muted-foreground">
        소셜 로그인은 OAuth 클라이언트 설정 후 사용할 수 있습니다.
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
          aria-label={provider.signInButtonAlt}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- OAuth 공식 버튼 에셋 URL */}
          <img
            src={provider.signInButtonSrc}
            alt={provider.signInButtonAlt}
            className="h-10 w-auto max-w-full object-contain"
            loading="lazy"
          />
        </button>
      ))}
    </div>
  );
}
