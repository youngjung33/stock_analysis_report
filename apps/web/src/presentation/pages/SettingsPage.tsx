'use client';

import { OAUTH_PROVIDER_META } from '@sar/shared';
import { AppShell } from '../layout';
import { PageStack, Surface } from '../design-system';
import { useSettingsScreen } from '../hooks/screens/useSettingsScreen';

export function SettingsPage() {
  const screen = useSettingsScreen();

  return (
    <AppShell title="계정 설정" subtitle={screen.profile?.username ?? ''}>
      <PageStack>
        {screen.loading && <p className="text-sm text-muted-foreground">불러오는 중...</p>}

        {screen.profile && (
          <>
            <Surface variant="section" className="space-y-4">
              <div>
                <h2 className="text-base font-semibold">이메일</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {screen.profile.emailVerified ? '인증됨' : '미인증'}
                  {screen.profile.email && !screen.profile.emailVerified && (
                    <button
                      type="button"
                      onClick={screen.handleRequestVerificationCode}
                      disabled={screen.saving}
                      className="ml-2 text-primary hover:underline"
                    >
                      인증 코드 받기
                    </button>
                  )}
                </p>
              </div>
              <form onSubmit={screen.handleChangeEmail} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <label className="block flex-1">
                  <span className="text-xs text-muted-foreground">이메일</span>
                  <input
                    type="email"
                    className="mt-1 w-full rounded-lg border border-border-strong bg-muted px-3 py-2 text-sm"
                    value={screen.email}
                    onChange={(e) => screen.setEmail(e.target.value)}
                  />
                </label>
                <button
                  type="submit"
                  disabled={screen.saving}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  저장 · 코드 발급
                </button>
              </form>

              {screen.profile.email && !screen.profile.emailVerified && (
                <form onSubmit={screen.handleConfirmVerification} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <label className="block flex-1">
                    <span className="text-xs text-muted-foreground">인증 코드 (6자리)</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      pattern="\d{6}"
                      className="mt-1 w-full rounded-lg border border-border-strong bg-muted px-3 py-2 text-sm tracking-widest"
                      value={screen.verificationCode}
                      onChange={(e) => screen.setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={screen.saving || screen.verificationCode.length !== 6}
                    className="rounded-lg border border-border-strong px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
                  >
                    인증하기
                  </button>
                </form>
              )}
            </Surface>

            {screen.profile.hasPassword && (
              <Surface variant="section" className="space-y-4">
                <h2 className="text-base font-semibold">비밀번호 변경</h2>
                <form onSubmit={screen.handleChangePassword} className="space-y-3">
                  <label className="block">
                    <span className="text-xs text-muted-foreground">현재 비밀번호</span>
                    <input
                      type="password"
                      className="mt-1 w-full rounded-lg border border-border-strong bg-muted px-3 py-2 text-sm"
                      value={screen.currentPassword}
                      onChange={(e) => screen.setCurrentPassword(e.target.value)}
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs text-muted-foreground">새 비밀번호</span>
                    <input
                      type="password"
                      className="mt-1 w-full rounded-lg border border-border-strong bg-muted px-3 py-2 text-sm"
                      value={screen.newPassword}
                      onChange={(e) => screen.setNewPassword(e.target.value)}
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs text-muted-foreground">새 비밀번호 확인</span>
                    <input
                      type="password"
                      className="mt-1 w-full rounded-lg border border-border-strong bg-muted px-3 py-2 text-sm"
                      value={screen.newPasswordConfirm}
                      onChange={(e) => screen.setNewPasswordConfirm(e.target.value)}
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={screen.saving}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                  >
                    비밀번호 변경
                  </button>
                </form>
              </Surface>
            )}

            <Surface variant="section" className="space-y-3">
              <h2 className="text-base font-semibold">소셜 로그인 연동</h2>
              {screen.profile.oauthAccounts.length === 0 ? (
                <p className="text-sm text-muted-foreground">연동된 소셜 계정이 없습니다.</p>
              ) : (
                <ul className="space-y-2">
                  {screen.profile.oauthAccounts.map((acc) => (
                    <li
                      key={acc.provider}
                      className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium">{OAUTH_PROVIDER_META[acc.provider].label}</p>
                        <p className="text-xs text-muted-foreground">{acc.email ?? '—'}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => screen.handleUnlink(acc.provider)}
                        disabled={screen.saving}
                        className="text-xs text-danger hover:underline disabled:opacity-50"
                      >
                        연동 해제
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Surface>

            <Surface variant="section" className="space-y-4 border-danger/30">
              <div>
                <h2 className="text-base font-semibold text-danger">회원탈퇴</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  탈퇴 시 매매 내역, 관심종목, 소셜 연동 등 계정 데이터가 DB에서 영구 삭제됩니다.
                </p>
              </div>
              {screen.profile.hasPassword && (
                <label className="block">
                  <span className="text-xs text-muted-foreground">비밀번호 확인</span>
                  <input
                    type="password"
                    className="mt-1 w-full rounded-lg border border-border-strong bg-muted px-3 py-2 text-sm"
                    value={screen.deletePassword}
                    onChange={(e) => screen.setDeletePassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </label>
              )}
              <button
                type="button"
                onClick={screen.handleDeleteAccount}
                disabled={screen.saving || (screen.profile.hasPassword && !screen.deletePassword)}
                className="rounded-lg border border-danger/50 px-4 py-2 text-sm font-medium text-danger hover:bg-danger/10 disabled:opacity-50"
              >
                회원탈퇴
              </button>
            </Surface>
          </>
        )}
      </PageStack>
    </AppShell>
  );
}
