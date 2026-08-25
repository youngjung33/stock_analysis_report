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

export async function loginAsMember(page: Page): Promise<void> {
  const username = process.env.E2E_USERNAME;
  const password = process.env.E2E_PASSWORD;
  if (!username || !password) {
    throw new Error('E2E_USERNAME and E2E_PASSWORD are required for member E2E');
  }

  await page.goto('/login');
  await ensureKoreanLocale(page);
  await page.getByPlaceholder('아이디').fill(username);
  await page.getByPlaceholder('비밀번호').fill(password);
  await page.getByRole('button', { name: '로그인' }).click();
  await expect(page).toHaveURL('/', { timeout: 20_000 });
}

export function hasMemberE2ECredentials(): boolean {
  return Boolean(process.env.E2E_USERNAME?.trim() && process.env.E2E_PASSWORD?.trim());
}
