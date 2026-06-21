import { FormEvent, useState } from 'react';
import { useAuth } from '../useAuth';

export function useLoginScreen() {
  const { login, loginAsGuest, isAuthenticated } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch {
      setError('아이디 또는 비밀번호가 올바르지 않습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGuestLogin() {
    setError('');
    setGuestLoading(true);
    try {
      await loginAsGuest();
    } catch {
      setError('비회원 로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setGuestLoading(false);
    }
  }

  return {
    isAuthenticated,
    username,
    setUsername,
    password,
    setPassword,
    error,
    loading,
    guestLoading,
    handleSubmit,
    handleGuestLogin,
  };
}
