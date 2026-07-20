'use client';

import { useTransactionsScreen } from '../hooks/screens/useTransactionsScreen';
import { TransactionForm } from '../features/transactions/TransactionForm';
import { TransactionList } from '../features/transactions/TransactionList';
import { CorporateActionForm } from '../components/CorporateActionForm';
import { CorporateActionList } from '../features/transactions/CorporateActionList';
import { AppShell } from '../layout';
import { PageStack } from '../design-system';

export function TransactionsPage() {
  const screen = useTransactionsScreen();

  return (
    <AppShell title="매매·배당">
      <PageStack>
        <TransactionForm onSuccess={screen.onTransactionCreated} />
        <CorporateActionForm onSuccess={screen.onTransactionCreated} />
        <section>
          <h2 className="mb-5 text-base font-semibold tracking-tight md:text-lg">배당·분할·합병 내역</h2>
          <CorporateActionList refreshKey={screen.refreshKey} />
        </section>
        <section>
          <h2 className="mb-5 text-base font-semibold tracking-tight md:text-lg">매매 내역</h2>
          <TransactionList refreshKey={screen.refreshKey} />
        </section>
      </PageStack>
    </AppShell>
  );
}
