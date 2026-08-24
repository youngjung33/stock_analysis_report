import { expect, type Page } from '@playwright/test';

/** E2E helpers — locale-safe (defaults to Korean UI) */

export async function ensureKoreanLocale(page: Page): Promise<void> {
  const koButton = page.getByRole('button', { name: '한국어' });
  if (await koButton.isVisible()) {
    const pressed = await koButton.getAttribute('aria-pressed');
    if (pressed !== 'true') {
      await koButton.click();
    }
  }
}

export async function enterAsGuest(page: Page): Promise<void> {
  await page.goto('/login');
  await ensureKoreanLocale(page);
  const guestBtn = page.getByRole('button', { name: '비회원으로 입장' });
  await expect(guestBtn).toBeVisible({ timeout: 20_000 });
  await guestBtn.click();
  await expect(page).toHaveURL('/', { timeout: 20_000 });
}

export async function seedGuestCapital(page: Page, amount = '10000000'): Promise<void> {
  await page.goto('/my-info');
  await page.getByPlaceholder('예: 10,000,000').fill(amount);
  await page.getByRole('button', { name: '투자 원금 설정' }).click();
  await expect(page.getByText('₩10,000,000').first()).toBeVisible({ timeout: 10_000 });
}

export function tradeRegistrationForm(page: Page) {
  return page.locator('form').filter({ has: page.getByRole('heading', { name: '매매 등록' }) });
}
