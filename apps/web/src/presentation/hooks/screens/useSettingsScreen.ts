'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { OAUTH_PROVIDER_META, OAuthProviderId } from '@sar/shared';
import { getErrorMessage } from '@/client/domain/errors/app-error';
import { useToast } from '../../components/Toast';
import { useAuth } from '../useAuth';
import { useServices } from '../useServices';

export function useSettingsScreen() {
  const { isGuest } = useAuth();
  const {
    getAccountUseCase,
    changePasswordUseCase,
    changeEmailUseCase,
    requestEmailVerificationUseCase,
    unlinkOAuthUseCase,
  } = useServices();
  const { showError, showSuccess } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof getAccountUseCase.execute>> | null>(
    null,
  );

  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
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

  useEffect(() => {
    if (searchParams.get('verified') === '1') {
      showSuccess('이메일 인증이 완료되었습니다.');
      router.replace('/settings', { scroll: false });
    }
    if (searchParams.get('verifyError') === '1') {
      showError('이메일 인증 링크가 유효하지 않습니다.');
      router.replace('/settings', { scroll: false });
    }
  }, [searchParams, showSuccess, showError, router]);

  async function handleChangeEmail(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await changeEmailUseCase.execute(email.trim());
      showSuccess('인증 메일을 발송했습니다. 메일함을 확인해 주세요.');
      await reload();
    } catch (err) {
      showError(getErrorMessage(err, '이메일 변경에 실패했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleResendVerification() {
    setSaving(true);
    try {
      await requestEmailVerificationUseCase.execute();
      showSuccess('인증 메일을 다시 보냈습니다.');
    } catch (err) {
      showError(getErrorMessage(err, '인증 메일 발송에 실패했습니다.'));
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

  return {
    loading,
    profile,
    email,
    setEmail,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    newPasswordConfirm,
    setNewPasswordConfirm,
    saving,
    handleChangeEmail,
    handleResendVerification,
    handleChangePassword,
    handleUnlink,
  };
}
