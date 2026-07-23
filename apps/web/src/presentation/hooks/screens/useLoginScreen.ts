'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  OAuthProviderId,
  OAuthProviderMeta,
  RegisterFieldErrors,
  validateRegisterFields,
  validateUsernameFormatCode,
  isAppErrorCode,
} from '@sar/shared';
import { getErrorMessage, translateResponseCode, translateUsernameCheckResult } from '@/client/domain/errors/app-error';
import { useToast } from '../../components/Toast';
import { useAuth } from '../useAuth';
import { useServices } from '../useServices';

export type UsernameCheckStatus = 'idle' | 'checking' | 'available' | 'unavailable';

export function useLoginScreen() {
  const { t } = useTranslation();
  const { login, register, startOAuthLogin, loginAsGuest, isAuthenticated } = useAuth();
  const { listOAuthProvidersUseCase, checkUsernameAvailabilityUseCase } = useServices();
  const { showError, showSuccess } = useToast();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [oauthProviders, setOauthProviders] = useState<OAuthProviderMeta[]>([]);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [usernameCheckStatus, setUsernameCheckStatus] = useState<UsernameCheckStatus>('idle');
  const [usernameCheckMessage, setUsernameCheckMessage] = useState('');
  const [postAuthPath, setPostAuthPath] = useState('/');

  useEffect(() => {
    listOAuthProvidersUseCase
      .execute()
      .then(setOauthProviders)
      .catch(() => setOauthProviders([]))
      .finally(() => setProvidersLoading(false));
  }, [listOAuthProvidersUseCase]);

  function switchMode(next: 'login' | 'register') {
    setMode(next);
    setFieldErrors({});
    setUsernameCheckStatus('idle');
    setUsernameCheckMessage('');
  }

  async function checkUsernameAvailability() {
    if (mode !== 'register') return;

    const formatErrorCode = validateUsernameFormatCode(username);
    if (formatErrorCode) {
      const message = translateResponseCode(formatErrorCode);
      setUsernameCheckStatus('unavailable');
      setUsernameCheckMessage(message);
      setFieldErrors((prev) => ({ ...prev, username: formatErrorCode }));
      showError(message);
      return;
    }

    setUsernameCheckStatus('checking');
    setUsernameCheckMessage(t('auth.usernameChecking'));

    try {
      const result = await checkUsernameAvailabilityUseCase.execute(username.trim());
      const message = translateUsernameCheckResult(result);
      setUsernameCheckStatus(result.available ? 'available' : 'unavailable');
      setUsernameCheckMessage(message);
      setFieldErrors((prev) => {
        const next = { ...prev };
        if (result.available) {
          delete next.username;
        } else if (isAppErrorCode(result.code)) {
          next.username = result.code;
        }
        return next;
      });
      if (result.available) {
        showSuccess(message);
      } else {
        showError(message);
      }
    } catch (err) {
      const message = getErrorMessage(err, t('auth.usernameCheckFailed'));
      setUsernameCheckStatus('unavailable');
      setUsernameCheckMessage(message);
      showError(message);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFieldErrors({});

    if (mode === 'register') {
      const errors = validateRegisterFields({
        username,
        password,
        passwordConfirm,
        email: email.trim() || null,
      });

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        const firstCode = Object.values(errors)[0];
        showError(firstCode ? t(`errors.${firstCode}`) : t('errors.VALIDATION'));
        return;
      }

      const usernameResult = await checkUsernameAvailabilityUseCase.execute(username.trim());
      if (!usernameResult.available) {
        const message = translateUsernameCheckResult(usernameResult);
        setUsernameCheckStatus('unavailable');
        setUsernameCheckMessage(message);
        setFieldErrors(
          isAppErrorCode(usernameResult.code) ? { username: usernameResult.code } : {},
        );
        showError(message);
        return;
      }
      setUsernameCheckStatus('available');
      setUsernameCheckMessage(translateUsernameCheckResult(usernameResult));
    }

    setLoading(true);
    try {
      if (mode === 'register') {
        setPostAuthPath('/?welcome=1');
        await register({
          username: username.trim(),
          password,
          passwordConfirm,
          email: email.trim() || null,
        });
      } else {
        setPostAuthPath('/');
        await login(username, password);
      }
    } catch (err) {
      showError(getErrorMessage(err, t('common.requestFailed')));
    } finally {
      setLoading(false);
    }
  }

  async function handleGuestLogin() {
    setGuestLoading(true);
    try {
      await loginAsGuest();
    } catch {
      showError(t('auth.guestLoginFailed'));
    } finally {
      setGuestLoading(false);
    }
  }

  const handleOAuthLogin = useCallback(
    async (provider: OAuthProviderId) => {
      setOauthLoading(true);
      try {
        const redirectUri = `${window.location.origin}/api/auth/oauth/${provider}/callback`;
        await startOAuthLogin(provider, redirectUri);
      } catch (err) {
        showError(getErrorMessage(err, t('auth.oauthStartFailed')));
        setOauthLoading(false);
      }
    },
    [startOAuthLogin, showError, t],
  );

  return {
    mode,
    setMode: switchMode,
    isAuthenticated,
    postAuthPath,
    username,
    setUsername: (value: string) => {
      setUsername(value);
      setUsernameCheckStatus('idle');
      setUsernameCheckMessage('');
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.username;
        return next;
      });
    },
    email,
    setEmail,
    password,
    setPassword,
    passwordConfirm,
    setPasswordConfirm,
    fieldErrors,
    loading,
    guestLoading,
    oauthLoading,
    oauthProviders,
    providersLoading,
    usernameCheckStatus,
    usernameCheckMessage,
    checkUsernameAvailability,
    handleSubmit,
    handleGuestLogin,
    handleOAuthLogin,
    usernameHint: t('auth.usernameHint'),
    passwordHint: t('auth.passwordHint'),
  };
}
