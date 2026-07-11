'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { OAUTH_PROVIDER_META, OAuthProviderId } from '@sar/shared';
import { getErrorMessage } from '@/client/domain/errors/app-error';
import { useToast } from '../../components/Toast';
import { useAuth } from '../useAuth';
import { useServices } from '../useServices';

function showVerificationCodeToast(
  showSuccess: (msg: string) => void,
  verificationCode: string,
) {
  showSuccess(`인증 코드: ${verificationCode}`);
}

export function useSettingsScreen() {
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
      showError(getErrorMessage(err, '계정 정보를 불러오지 못했습니다.'));
    } finally {
      setLoading(false);
    }
  }, [getAccountUseCase, showError]);

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
      showVerificationCodeToast(showSuccess, result.verificationCode);
      setVerificationCode('');
      await reload();
    } catch (err) {
      showError(getErrorMessage(err, '이메일 변경에 실패했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleRequestVerificationCode() {
    setSaving(true);
    try {
      const result = await requestEmailVerificationUseCase.execute();
      if (!result) {
        showSuccess('이미 인증된 이메일입니다.');
        return;
      }
      showVerificationCodeToast(showSuccess, result.verificationCode);
    } catch (err) {
      showError(getErrorMessage(err, '인증 코드 발급에 실패했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmVerification(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await confirmEmailVerificationUseCase.execute(verificationCode.trim());
      showSuccess('이메일 인증이 완료되었습니다.');
      setVerificationCode('');
      await reload();
    } catch (err) {
      showError(getErrorMessage(err, '인증 코드가 올바르지 않습니다.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await changePasswordUseCase.execute({
        currentPassword,
        newPassword,
        newPasswordConfirm,
      });
      showSuccess('비밀번호가 변경되었습니다.');
      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordConfirm('');
      await reload();
    } catch (err) {
      showError(getErrorMessage(err, '비밀번호 변경에 실패했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleUnlink(provider: OAuthProviderId) {
    if (!confirm(`${OAUTH_PROVIDER_META[provider].label} 연동을 해제할까요?`)) return;
    setSaving(true);
    try {
      await unlinkOAuthUseCase.execute(provider);
      showSuccess('소셜 계정 연동을 해제했습니다.');
      await reload();
    } catch (err) {
      showError(getErrorMessage(err, '연동 해제에 실패했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    if (
      !confirm(
        '탈퇴 시 거래·관심종목·연동 계정 등 모든 데이터가 삭제되며 복구할 수 없습니다. 정말 탈퇴할까요?',
      )
    ) {
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
      showError(getErrorMessage(err, '회원탈퇴에 실패했습니다.'));
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
