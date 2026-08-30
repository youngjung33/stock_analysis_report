'use client';

import { FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatApiSuccessMessage, getErrorMessage } from '@/client/domain/errors/app-error';
import { useToast } from '../../components/Toast';
import { useServices } from '../useServices';

export function useForgotPasswordScreen() {
  const { t } = useTranslation();
  const { requestPasswordResetUseCase } = useServices();
  const { showError, showSuccess } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await requestPasswordResetUseCase.execute(email.trim());
      showSuccess(formatApiSuccessMessage(result));
    } catch (err) {
      showError(getErrorMessage(err, t('common.requestFailed')));
    } finally {
      setLoading(false);
    }
  }

  return {
    email,
    setEmail,
    loading,
    handleSubmit,
  };
}
