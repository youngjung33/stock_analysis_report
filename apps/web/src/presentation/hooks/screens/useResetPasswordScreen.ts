'use client';

import { FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { formatApiSuccessMessage, getErrorMessage } from '@/client/domain/errors/app-error';
import { useToast } from '../../components/Toast';
import { useServices } from '../useServices';

export function useResetPasswordScreen() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const { resetPasswordUseCase } = useServices();
  const { showError, showSuccess } = useToast();
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) {
      showError(t('auth.resetLinkInvalid'));
      return;
    }

    setLoading(true);
    try {
      const result = await resetPasswordUseCase.execute({ token, password, passwordConfirm });
      showSuccess(formatApiSuccessMessage(result));
      router.replace('/login');
    } catch (err) {
      showError(getErrorMessage(err, t('auth.resetPasswordFailed')));
    } finally {
      setLoading(false);
    }
  }

  return {
    token,
    password,
    setPassword,
    passwordConfirm,
    setPasswordConfirm,
    loading,
    handleSubmit,
  };
}
