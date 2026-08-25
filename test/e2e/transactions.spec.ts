import { test, expect } from '@playwright/test';
import {
  enterAsGuest,
  hasMemberE2ECredentials,
  loginAsMember,
  seedGuestCapital,
  tradeRegistrationForm,
} from './helpers';

test.describe('guest transactions', () => {
  test.setTimeout(90_000);

  test('guest can register KR buy with commission', async ({ page }) => {
    await enterAsGuest(page);
    await seedGuestCapital(page);

    await page.goto('/transactions');
    const form = tradeRegistrationForm(page);
    await form.getByPlaceholder('종목명 또는 코드 (예: 삼성전자, 005930)').fill('005930');
    await form.getByRole('button', { name: '005930' }).first().click({ timeout: 20_000 });

    await form.locator('input[type="number"]').fill('10');
    await form.getByLabel('단가').fill('70000');
    await form.getByLabel('수수료 (선택)').fill('1000');
    await form.getByRole('button', { name: '등록' }).click();

    await expect(page.getByText('매매가 등록되었습니다.')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('table tbody').getByText('005930')).toBeVisible();
    await expect(page.locator('table tbody').getByText('₩1,000')).toBeVisible();
  });

  test('guest can sell held shares', async ({ page }) => {
    await enterAsGuest(page);
    await seedGuestCapital(page);

    await page.goto('/transactions');
    let form = tradeRegistrationForm(page);
    await form.getByPlaceholder('종목명 또는 코드 (예: 삼성전자, 005930)').fill('005930');
    await form.getByRole('button', { name: '005930' }).first().click({ timeout: 20_000 });
    await form.locator('input[type="number"]').fill('5');
    await form.getByLabel('단가').fill('70000');
    await form.getByRole('button', { name: '등록' }).click();
    await expect(page.getByText('매매가 등록되었습니다.')).toBeVisible({ timeout: 15_000 });

    form = tradeRegistrationForm(page);
    await form.getByLabel('매매 구분').selectOption('SELL');
    await form.getByPlaceholder('종목명 또는 코드 (예: 삼성전자, 005930)').fill('005930');
    await form.getByRole('button', { name: '005930' }).first().click({ timeout: 20_000 });
    await form.locator('input[type="number"]').fill('2');
    await form.getByLabel('단가').fill('75000');
    await form.getByRole('button', { name: '등록' }).click();

    await expect(page.getByText('매매가 등록되었습니다.')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('table tbody').getByText('매도')).toBeVisible();
  });
});

test.describe('member transactions', () => {
  test.setTimeout(90_000);

  test.beforeEach(() => {
    test.skip(
      !hasMemberE2ECredentials(),
      'Set E2E_USERNAME and E2E_PASSWORD to run member transaction E2E',
    );
  });

  test('member can register KR buy', async ({ page }) => {
    await loginAsMember(page);
    await seedGuestCapital(page);

    await page.goto('/transactions');
    const form = tradeRegistrationForm(page);
    await form.getByPlaceholder('종목명 또는 코드 (예: 삼성전자, 005930)').fill('005930');
    await form.getByRole('button', { name: '005930' }).first().click({ timeout: 20_000 });
    await form.locator('input[type="number"]').fill('3');
    await form.getByLabel('단가').fill('70000');
    await form.getByRole('button', { name: '등록' }).click();

    await expect(page.getByText('매매가 등록되었습니다.')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('table tbody').getByText('005930')).toBeVisible();
  });
});

test.describe('market analysis', () => {
  test.setTimeout(90_000);

  test('guest sees figure pulse section when analysis loads', async ({ page }) => {
    await enterAsGuest(page);
    await page.goto('/market/analysis');
    await expect(page.getByRole('heading', { name: '시장 심층 분석' })).toBeVisible();

    const figurePulse = page.getByRole('heading', { name: '인물 발언 Pulse' });
    const loading = page.getByText('경기·지수·업종·뉴스 분석 중');

    await expect(figurePulse.or(loading)).toBeVisible({ timeout: 45_000 });
    if (await figurePulse.isVisible()) {
      await expect(page.getByText('최근 72시간 내 영향력 인물 헤드라인')).toBeVisible();
    }
  });
});
