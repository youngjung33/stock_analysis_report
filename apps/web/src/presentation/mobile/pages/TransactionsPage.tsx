import { useTransactionsScreen } from '../../hooks/screens/useTransactionsScreen';
import { MobileTransactionForm } from '../features/transactions/TransactionForm';
import { MobileTransactionCardList } from '../features/transactions/TransactionCardList';
import { CorporateActionForm } from '../../components/CorporateActionForm';
import { AppShell } from '../../layout';
import { PageStack } from '../../design-system';

export function MobileTransactionsPage() {
  const screen = useTransactionsScreen();

  return (
    <AppShell title="거래">
      <PageStack>
        <MobileTransactionForm onSuccess={screen.onTransactionCreated} />
        <CorporateActionForm onSuccess={screen.onTransactionCreated} />
        <section>
          <h2 className="mb-4 text-base font-semibold tracking-tight">거래 내역</h2>
          <MobileTransactionCardList refreshKey={screen.refreshKey} />
        </section>
      </PageStack>
    </AppShell>
  );
}
