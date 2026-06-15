import { Navigate } from 'react-router-dom';
import { useLoginScreen } from '../../hooks/screens/useLoginScreen';

export function MobileLoginPage() {
  const screen = useLoginScreen();

  if (screen.isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-950 px-4 py-8">
      <form
        onSubmit={screen.handleSubmit}
        className="w-full space-y-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-6"
      >
        <h1 className="text-xl font-bold text-white">포트폴리오</h1>
        <p className="text-xs text-slate-400">로그인 후 거래와 시세를 관리하세요.</p>

        {screen.error && <p className="text-sm text-rose-400">{screen.error}</p>}

        <label className="block">
          <span className="text-xs text-slate-400">아이디</span>
          <input
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white"
            value={screen.username}
            onChange={(e) => screen.setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </label>

        <label className="block">
          <span className="text-xs text-slate-400">비밀번호</span>
          <input
            type="password"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white"
            value={screen.password}
            onChange={(e) => screen.setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        <button
          type="submit"
          disabled={screen.loading}
          className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {screen.loading ? '로그인 중...' : '로그인'}
        </button>
      </form>
    </div>
  );
}
