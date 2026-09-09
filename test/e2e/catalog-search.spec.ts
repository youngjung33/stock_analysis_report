import { test, expect } from '@playwright/test';
import {
  enterAsGuest,
  hasMemberE2E,
  MEMBER_E2E_SKIP_REASON,
  seedGuestCapital,
  selectStockInTradeForm,
  tradeRegistrationForm,
} from './helpers';

test.describe('catalog search', () => {
  test.setTimeout(90_000);

  test.beforeEach(() => {
    test.skip(!hasMemberE2E(), MEMBER_E2E_SKIP_REASON);
  });

  test('guest can find catalog fixture stock in trade form', async ({ page }) => {
    await enterAsGuest(page);
    await seedGuestCapital(page);

    await page.goto('/transactions');
    const form = tradeRegistrationForm(page);
    await selectStockInTradeForm(form, 'E2E Catalog', 'E2ETST');
    await expect(form.getByText('E2E Catalog Test')).toBeVisible();
  });
});
