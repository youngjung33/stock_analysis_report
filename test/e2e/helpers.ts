import { expect, type Locator, type Page } from '@playwright/test';
import { hasMemberE2E, resolveMemberE2ECredentials } from './member-e2e-env';

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

  const oauthLoading = page.getByText('소셜 로그인 불러오는 중...');
  if (await oauthLoading.isVisible()) {
    await expect(oauthLoading).toBeHidden({ timeout: 45_000 });
  }

  const guestBtn = page.getByRole('button', { name: '비회원으로 입장', exact: true });
  await expect(guestBtn).toBeVisible({ timeout: 30_000 });
  await expect(guestBtn).toBeEnabled({ timeout: 30_000 });

  await Promise.all([page.waitForURL('/', { timeout: 60_000 }), guestBtn.click()]);
}

function capitalSetupForm(page: Page) {
  return page.locator('form').filter({ has: page.getByRole('button', { name: '투자 원금 설정' }) });
}

export async function seedGuestCapital(page: Page, amount = '10000000'): Promise<void> {
  await page.goto('/my-info');

  const form = capitalSetupForm(page);
  await expect(form).toBeVisible({ timeout: 30_000 });

  const krwInput = form.getByPlaceholder('예: 10,000,000');
  await expect(krwInput).toBeEnabled();
  await krwInput.click();
  await krwInput.fill(amount);

  await form.getByRole('button', { name: '투자 원금 설정' }).click();
  await expect(page.getByText('투자 원금이 반영되었습니다.').first()).toBeVisible({ timeout: 15_000 });
}

export function tradeRegistrationForm(page: Page) {
  return page.locator('form').filter({ has: page.getByRole('heading', { name: '매매 등록' }) });
}

export async function selectStockInTradeForm(
  form: Locator,
  query: string,
  resultButtonName: string,
): Promise<void> {
  const input = form.getByPlaceholder('종목명 또는 코드 (예: 삼성전자, 005930)');
  await input.fill(query);
  const resultBtn = form.getByRole('button', { name: resultButtonName }).first();
  await expect(resultBtn).toBeVisible({ timeout: 45_000 });
  await resultBtn.click({ timeout: 45_000, noWaitAfter: true });
}

export async function expectTradeRegisteredToast(page: Page) {
  await expect(page.getByText('매매가 등록되었습니다.').first()).toBeVisible({ timeout: 15_000 });
}

export async function loginAsMember(page: Page): Promise<void> {
  if (!hasMemberE2E()) {
    throw new Error('Member E2E requires DATABASE_URL and seed credentials');
  }

  const { username, password } = resolveMemberE2ECredentials();

  await page.goto('/login');
  await ensureKoreanLocale(page);
  const loginForm = page.locator('form').filter({ has: page.getByRole('heading', { level: 1 }) });
  await expect(loginForm.getByRole('button', { name: '로그인', exact: true })).toBeVisible({
    timeout: 20_000,
  });
  await loginForm.getByLabel('아이디').fill(username);
  await loginForm.getByLabel('비밀번호').fill(password);
  await loginForm.locator('button[type="submit"]').click();
  await expect(page).toHaveURL('/', { timeout: 20_000 });
}

export { hasMemberE2E, MEMBER_E2E_SKIP_REASON } from './member-e2e-env';
