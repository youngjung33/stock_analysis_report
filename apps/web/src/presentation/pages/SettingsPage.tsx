'use client';

import { OAUTH_PROVIDER_META } from '@sar/shared';
import { useTranslation } from 'react-i18next';
import { AppShell } from '../layout';
import { PageStack, Surface } from '../design-system';
import { useSettingsScreen } from '../hooks/screens/useSettingsScreen';

export function SettingsPage() {
  const screen = useSettingsScreen();
  const { t } = useTranslation();

  return (
    <AppShell title={t('settings.title')} subtitle={screen.profile?.username ?? ''}>
      <PageStack>
        {screen.loading && <p className="text-sm text-muted-foreground">{t('common.loading')}</p>}

        {screen.profile && (
          <>
            <Surface variant="section" className="space-y-4">
              <div>
                <h2 className="text-base font-semibold">{t('settings.email')}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {screen.profile.emailVerified ? t('settings.emailVerified') : t('settings.emailUnverified')}
                  {screen.profile.email && !screen.profile.emailVerified && (
                    <button
                      type="button"
                      onClick={screen.handleRequestVerificationCode}
                      disabled={screen.saving}
                      className="ml-2 text-primary hover:underline"
                    >
                      {t('settings.requestVerificationCode')}
                    </button>
                  )}
                </p>
              </div>
              <form onSubmit={screen.handleChangeEmail} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <label className="block flex-1">
                  <span className="text-xs text-muted-foreground">{t('settings.email')}</span>
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
                  {t('settings.saveAndIssueCode')}
                </button>
              </form>

              {screen.profile.email && !screen.profile.emailVerified && (
                <form onSubmit={screen.handleConfirmVerification} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <label className="block flex-1">
                    <span className="text-xs text-muted-foreground">{t('settings.verificationCode')}</span>
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
                    {t('settings.verify')}
                  </button>
                </form>
              )}
            </Surface>

            {screen.profile.hasPassword && (
              <Surface variant="section" className="space-y-4">
                <h2 className="text-base font-semibold">{t('settings.changePassword')}</h2>
                <form onSubmit={screen.handleChangePassword} className="space-y-3">
                  <label className="block">
                    <span className="text-xs text-muted-foreground">{t('settings.currentPassword')}</span>
                    <input
                      type="password"
                      className="mt-1 w-full rounded-lg border border-border-strong bg-muted px-3 py-2 text-sm"
                      value={screen.currentPassword}
                      onChange={(e) => screen.setCurrentPassword(e.target.value)}
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs text-muted-foreground">{t('settings.newPassword')}</span>
                    <input
                      type="password"
                      className="mt-1 w-full rounded-lg border border-border-strong bg-muted px-3 py-2 text-sm"
                      value={screen.newPassword}
                      onChange={(e) => screen.setNewPassword(e.target.value)}
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs text-muted-foreground">{t('settings.newPasswordConfirm')}</span>
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
                    {t('settings.changePasswordButton')}
                  </button>
                </form>
              </Surface>
            )}

            <Surface variant="section" className="space-y-3">
              <h2 className="text-base font-semibold">{t('settings.socialAccounts')}</h2>
              {screen.profile.oauthAccounts.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('settings.noSocialAccounts')}</p>
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
                        {t('settings.unlink')}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Surface>

            <Surface variant="section" className="space-y-4 border-danger/30">
              <div>
                <h2 className="text-base font-semibold text-danger">{t('settings.deleteAccount')}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{t('settings.deleteAccountDesc')}</p>
              </div>
              {screen.profile.hasPassword && (
                <label className="block">
                  <span className="text-xs text-muted-foreground">{t('settings.deletePasswordConfirm')}</span>
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
                {t('settings.deleteAccountButton')}
              </button>
            </Surface>
          </>
        )}
      </PageStack>
    </AppShell>
  );
}
