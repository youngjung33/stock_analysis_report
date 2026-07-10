'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import {
  AUTH_PASSWORD_HINT,
  AUTH_USERNAME_HINT,
  OAuthProviderId,
  OAuthProviderMeta,
  RegisterFieldErrors,
  validateRegisterFields,
  validateUsernameFormat,
} from '@sar/shared';
import { getErrorMessage } from '@/client/domain/errors/app-error';
import { useToast } from '../../components/Toast';
import { useAuth } from '../useAuth';
import { useServices } from '../useServices';

export type UsernameCheckStatus = 'idle' | 'checking' | 'available' | 'unavailable';

export function useLoginScreen() {
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

    const formatError = validateUsernameFormat(username);
    if (formatError) {
      setUsernameCheckStatus('unavailable');
      setUsernameCheckMessage(formatError);
      setFieldErrors((prev) => ({ ...prev, username: formatError }));
      showError(formatError);
      return;
    }

    setUsernameCheckStatus('checking');
    setUsernameCheckMessage('아이디 확인 중...');

    try {
      const result = await checkUsernameAvailabilityUseCase.execute(username.trim());
      setUsernameCheckStatus(result.available ? 'available' : 'unavailable');
      setUsernameCheckMessage(result.message);
      setFieldErrors((prev) => {
        const next = { ...prev };
        if (result.available) {
          delete next.username;
        } else {
          next.username = result.message;
        }
        return next;
      });
      if (result.available) {
        showSuccess(result.message);
      } else {
        showError(result.message);
      }
    } catch (err) {
      const message = getErrorMessage(err, '아이디 확인에 실패했습니다.');
      setUsernameCheckStatus('unavailable');
      setUsernameCheckMessage(message);
      setFieldErrors((prev) => ({ ...prev, username: message }));
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
        showError(Object.values(errors)[0] ?? '입력값을 확인해 주세요.');
        return;
      }

      const usernameResult = await checkUsernameAvailabilityUseCase.execute(username.trim());
      if (!usernameResult.available) {
        setUsernameCheckStatus('unavailable');
        setUsernameCheckMessage(usernameResult.message);
        setFieldErrors({ username: usernameResult.message });
        showError(usernameResult.message);
        return;
      }
      setUsernameCheckStatus('available');
      setUsernameCheckMessage(usernameResult.message);
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
      showError(getErrorMessage(err, '요청을 처리하지 못했습니다.'));
    } finally {
      setLoading(false);
    }
  }

  async function handleGuestLogin() {
    setGuestLoading(true);
    try {
      await loginAsGuest();
    } catch {
      showError('비회원 로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.');
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
        showError(getErrorMessage(err, '소셜 로그인을 시작하지 못했습니다.'));
        setOauthLoading(false);
      }
    },
    [startOAuthLogin, showError],
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
    usernameHint: AUTH_USERNAME_HINT,
    passwordHint: AUTH_PASSWORD_HINT,
  };
}
