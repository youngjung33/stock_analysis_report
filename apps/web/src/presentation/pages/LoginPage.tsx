import { FormEvent, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

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

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-xl"
      >
        <h1 className="text-2xl font-bold text-white">포트폴리오 대시보드</h1>
        <p className="text-sm text-slate-400">로그인 후 거래와 시세를 관리하세요.</p>

        {error && <p className="text-sm text-rose-400">{error}</p>}

        <label className="block">
          <span className="text-sm text-slate-400">아이디</span>
          <input
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </label>

        <label className="block">
          <span className="text-sm text-slate-400">비밀번호</span>
          <input
            type="password"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-indigo-600 py-2 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>
    </div>
  );
}
