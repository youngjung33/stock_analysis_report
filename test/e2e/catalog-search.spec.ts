import { test, expect } from '@playwright/test';
import { enterAsGuest, hasMemberE2E, MEMBER_E2E_SKIP_REASON, seedGuestCapital, tradeRegistrationForm } from './helpers';

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
    await form.getByPlaceholder('종목명 또는 코드 (예: 삼성전자, 005930)').fill('E2E Catalog');
    await form.getByRole('button', { name: 'E2ETST' }).click({ timeout: 20_000 });
    await expect(form.getByText('E2E Catalog Test')).toBeVisible();
  });
});
