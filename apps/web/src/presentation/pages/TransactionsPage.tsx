import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { TransactionForm } from '../components/TransactionForm';
import { TransactionList } from '../components/TransactionList';

export function TransactionsPage() {
  const { logout } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold">거래 관리</h1>
          <div className="flex gap-3">
            <Link to="/" className="text-sm text-indigo-400 hover:text-indigo-300">
              대시보드
            </Link>
            <button
              onClick={() => logout()}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8">
        <TransactionForm onSuccess={() => setRefreshKey((k) => k + 1)} />
        <section>
          <h2 className="mb-4 text-lg font-semibold">거래 내역</h2>
          <TransactionList refreshKey={refreshKey} />
        </section>
      </main>
    </div>
  );
}
