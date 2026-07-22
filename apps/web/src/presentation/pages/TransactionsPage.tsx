'use client';

import { useTranslation } from 'react-i18next';
import { useTransactionsScreen } from '../hooks/screens/useTransactionsScreen';
import { TransactionForm } from '../features/transactions/TransactionForm';
import { TransactionList } from '../features/transactions/TransactionList';
import { CorporateActionForm } from '../components/CorporateActionForm';
import { CorporateActionList } from '../features/transactions/CorporateActionList';
import { AppShell } from '../layout';
import { PageStack } from '../design-system';

export function TransactionsPage() {
  const screen = useTransactionsScreen();
  const { t } = useTranslation();

  return (
    <AppShell title={t('transactions.title')}>
      <PageStack>
        <TransactionForm onSuccess={screen.onTransactionCreated} />
        <CorporateActionForm onSuccess={screen.onTransactionCreated} />
        <section>
          <h2 className="mb-5 text-base font-semibold tracking-tight md:text-lg">
            {t('transactions.corporateActions')}
          </h2>
          <CorporateActionList refreshKey={screen.refreshKey} />
        </section>
        <section>
          <h2 className="mb-5 text-base font-semibold tracking-tight md:text-lg">
            {t('transactions.tradeHistory')}
          </h2>
          <TransactionList refreshKey={screen.refreshKey} />
        </section>
      </PageStack>
    </AppShell>
  );
}
