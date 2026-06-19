'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function MobileFooterNav() {
  const pathname = usePathname();
  const isDashboard = pathname === '/';
  const isTransactions = pathname === '/transactions';

  const linkClass = (active: boolean) =>
    active ? 'text-indigo-400' : 'text-slate-500';

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-800 bg-slate-950/95 backdrop-blur"
      aria-label="하단 메뉴"
    >
      <div className="grid grid-cols-2 gap-1 px-2 py-2">
        <Link
          href="/"
          className={`flex flex-col items-center rounded-lg py-2.5 text-xs font-medium ${linkClass(isDashboard)}`}
        >
          대시보드
        </Link>
        <Link
          href="/transactions"
          className={`flex flex-col items-center rounded-lg py-2.5 text-xs font-medium ${linkClass(isTransactions)}`}
        >
          거래
        </Link>
      </div>
    </nav>
  );
}
