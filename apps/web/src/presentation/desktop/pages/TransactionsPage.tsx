import { useTransactionsScreen } from '../../hooks/screens/useTransactionsScreen';
import { DesktopTransactionForm } from '../features/transactions/TransactionForm';
import { DesktopTransactionList } from '../features/transactions/TransactionList';
import { CorporateActionForm } from '../../components/CorporateActionForm';
import { AppShell } from '../../layout';
import { PageStack } from '../../design-system';

export function DesktopTransactionsPage() {
  const screen = useTransactionsScreen();

  return (
    <AppShell title="거래 관리">
      <PageStack>
        <DesktopTransactionForm onSuccess={screen.onTransactionCreated} />
        <CorporateActionForm onSuccess={screen.onTransactionCreated} />
        <section>
          <h2 className="mb-5 text-lg font-semibold tracking-tight">거래 내역</h2>
          <DesktopTransactionList refreshKey={screen.refreshKey} />
        </section>
      </PageStack>
    </AppShell>
  );
}
