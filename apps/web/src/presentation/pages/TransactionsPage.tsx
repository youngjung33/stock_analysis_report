'use client';

import { useTransactionsScreen } from '../hooks/screens/useTransactionsScreen';
import { TransactionForm } from '../features/transactions/TransactionForm';
import { TransactionList } from '../features/transactions/TransactionList';
import { CorporateActionForm } from '../components/CorporateActionForm';
import { AppShell } from '../layout';
import { PageStack } from '../design-system';

export function TransactionsPage() {
  const screen = useTransactionsScreen();

  return (
    <AppShell title="거래 관리">
      <PageStack>
        <TransactionForm onSuccess={screen.onTransactionCreated} />
        <CorporateActionForm onSuccess={screen.onTransactionCreated} />
        <section>
          <h2 className="mb-5 text-base font-semibold tracking-tight md:text-lg">거래 내역</h2>
          <TransactionList refreshKey={screen.refreshKey} />
        </section>
      </PageStack>
    </AppShell>
  );
}
