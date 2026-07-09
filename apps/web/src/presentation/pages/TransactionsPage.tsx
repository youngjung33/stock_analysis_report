'use client';

import { useTransactionsScreen } from '../hooks/screens/useTransactionsScreen';
import { DesktopTransactionForm } from '../desktop/features/transactions/TransactionForm';
import { MobileTransactionForm } from '../mobile/features/transactions/TransactionForm';
import { DesktopTransactionList } from '../desktop/features/transactions/TransactionList';
import { MobileTransactionCardList } from '../mobile/features/transactions/TransactionCardList';
import { CorporateActionForm } from '../components/CorporateActionForm';
import { AppShell } from '../layout';
import { PageStack } from '../design-system';

export function TransactionsPage() {
  const screen = useTransactionsScreen();

  return (
    <AppShell title="거래 관리">
      <PageStack>
        <div className="md:hidden">
          <MobileTransactionForm onSuccess={screen.onTransactionCreated} />
        </div>
        <div className="hidden md:block">
          <DesktopTransactionForm onSuccess={screen.onTransactionCreated} />
        </div>
        <CorporateActionForm onSuccess={screen.onTransactionCreated} />
        <section>
          <h2 className="mb-5 text-base font-semibold tracking-tight md:text-lg">거래 내역</h2>
          <div className="md:hidden">
            <MobileTransactionCardList refreshKey={screen.refreshKey} />
          </div>
          <div className="hidden md:block">
            <DesktopTransactionList refreshKey={screen.refreshKey} />
          </div>
        </section>
      </PageStack>
    </AppShell>
  );
}
