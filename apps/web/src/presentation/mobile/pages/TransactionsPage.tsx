import { useTransactionsScreen } from '../../hooks/screens/useTransactionsScreen';
import { MobileTransactionForm } from '../features/transactions/TransactionForm';
import { MobileTransactionCardList } from '../features/transactions/TransactionCardList';
import { CorporateActionForm } from '../../components/CorporateActionForm';
import { MobileLayout } from '../layout/MobileLayout';

export function MobileTransactionsPage() {
  const screen = useTransactionsScreen();

  return (
    <MobileLayout title="거래" onLogout={() => screen.logout()}>
      <div className="space-y-6">
        <MobileTransactionForm onSuccess={screen.onTransactionCreated} />
        <CorporateActionForm onSuccess={screen.onTransactionCreated} />
        <section>
          <h2 className="mb-3 text-base font-semibold">거래 내역</h2>
          <MobileTransactionCardList refreshKey={screen.refreshKey} />
        </section>
      </div>
    </MobileLayout>
  );
}
