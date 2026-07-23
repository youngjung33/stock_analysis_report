'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { OAUTH_PROVIDER_META, OAuthProviderId } from '@sar/shared';
import { formatApiSuccessMessage, getErrorMessage } from '@/client/domain/errors/app-error';
import { useToast } from '../../components/Toast';
import { useAuth } from '../useAuth';
import { useServices } from '../useServices';

export function useSettingsScreen() {
  const { t } = useTranslation();
  const { isGuest, logout } = useAuth();
  const {
    getAccountUseCase,
    changePasswordUseCase,
    changeEmailUseCase,
    requestEmailVerificationUseCase,
    confirmEmailVerificationUseCase,
    unlinkOAuthUseCase,
    deleteAccountUseCase,
  } = useServices();
  const { showError, showSuccess } = useToast();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof getAccountUseCase.execute>> | null>(
    null,
  );

  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAccountUseCase.execute();
      setProfile(data);
      setEmail(data.email ?? '');
    } catch (err) {
      showError(getErrorMessage(err, t('settings.loadProfileFailed')));
    } finally {
      setLoading(false);
    }
  }, [getAccountUseCase, showError, t]);

  useEffect(() => {
    if (isGuest) {
      router.replace('/');
      return;
    }
    reload();
  }, [isGuest, router, reload]);

  async function handleChangeEmail(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const result = await changeEmailUseCase.execute(email.trim());
      showSuccess(formatApiSuccessMessage(result));
      setVerificationCode('');
      await reload();
    } catch (err) {
      showError(getErrorMessage(err, t('settings.changeEmailFailed')));
    } finally {
      setSaving(false);
    }
  }

  async function handleRequestVerificationCode() {
    setSaving(true);
    try {
      const result = await requestEmailVerificationUseCase.execute();
      showSuccess(formatApiSuccessMessage(result));
    } catch (err) {
      showError(getErrorMessage(err, t('settings.issueCodeFailed')));
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmVerification(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const result = await confirmEmailVerificationUseCase.execute(verificationCode.trim());
      showSuccess(formatApiSuccessMessage(result));
      setVerificationCode('');
      await reload();
    } catch (err) {
      showError(getErrorMessage(err, t('settings.verifyFailed')));
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const result = await changePasswordUseCase.execute({
        currentPassword,
        newPassword,
        newPasswordConfirm,
      });
      showSuccess(formatApiSuccessMessage(result));
      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordConfirm('');
      await reload();
    } catch (err) {
      showError(getErrorMessage(err, t('settings.passwordChangeFailed')));
    } finally {
      setSaving(false);
    }
  }

  async function handleUnlink(provider: OAuthProviderId) {
    if (!confirm(t('settings.unlinkConfirm', { provider: OAUTH_PROVIDER_META[provider].label }))) return;
    setSaving(true);
    try {
      const result = await unlinkOAuthUseCase.execute(provider);
      showSuccess(formatApiSuccessMessage(result));
      await reload();
    } catch (err) {
      showError(getErrorMessage(err, t('settings.unlinkFailed')));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    if (!confirm(t('settings.deleteConfirm'))) {
      return;
    }

    setSaving(true);
    try {
      await deleteAccountUseCase.execute({
        password: profile?.hasPassword ? deletePassword : undefined,
      });
      await logout().catch(() => undefined);
      router.replace('/login');
    } catch (err) {
      showError(getErrorMessage(err, t('settings.deleteFailed')));
    } finally {
      setSaving(false);
    }
  }

  return {
    loading,
    profile,
    email,
    setEmail,
    verificationCode,
    setVerificationCode,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    newPasswordConfirm,
    setNewPasswordConfirm,
    deletePassword,
    setDeletePassword,
    saving,
    handleChangeEmail,
    handleRequestVerificationCode,
    handleConfirmVerification,
    handleChangePassword,
    handleUnlink,
    handleDeleteAccount,
  };
}
