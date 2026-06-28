import { useTransactionsScreen } from '../../hooks/screens/useTransactionsScreen';
import { DesktopTransactionForm } from '../features/transactions/TransactionForm';
import { DesktopTransactionList } from '../features/transactions/TransactionList';
import { CorporateActionForm } from '../../components/CorporateActionForm';
import { DesktopLayout } from '../layout/DesktopLayout';
import { DesktopNavMenu } from '../navigation/DesktopNavMenu';

export function DesktopTransactionsPage() {
  const screen = useTransactionsScreen();

  return (
    <DesktopLayout
      title="거래 관리"
      headerActions={
        <DesktopNavMenu onLogout={() => screen.logout()} active="transactions" />
      }
    >
      <main className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        <DesktopTransactionForm onSuccess={screen.onTransactionCreated} />
        <CorporateActionForm onSuccess={screen.onTransactionCreated} />
        <section>
          <h2 className="mb-4 text-lg font-semibold">거래 내역</h2>
          <DesktopTransactionList refreshKey={screen.refreshKey} />
        </section>
      </main>
    </DesktopLayout>
  );
}
