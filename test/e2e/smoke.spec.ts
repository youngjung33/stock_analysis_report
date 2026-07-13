import { test, expect } from '@playwright/test';

async function enterAsGuest(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByRole('button', { name: '비회원으로 입장' }).click();
  await expect(page).toHaveURL('/');
}

test.describe('smoke', () => {
  test('login page renders', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: '로그인' })).toBeVisible();
    await expect(page.getByRole('link', { name: '비밀번호를 잊으셨나요?' })).toBeVisible();
  });

  test('forgot password page renders', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.getByRole('heading', { name: '비밀번호 찾기' })).toBeVisible();
  });

  test('guest can open dashboard', async ({ page }) => {
    await enterAsGuest(page);
    await expect(page.getByText('포트폴리오 대시보드')).toBeVisible();
  });

  test('register mode shows signup form', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: '회원가입' }).click();
    await expect(page.getByRole('button', { name: '회원가입' })).toBeVisible();
    await expect(page.getByText('아이디')).toBeVisible();
    await expect(page.getByText('이메일 (선택)')).toBeVisible();
  });

  test('guest can open transactions page', async ({ page }) => {
    await enterAsGuest(page);
    await page.goto('/transactions');
    await expect(page.getByRole('heading', { name: '거래 등록' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '거래 내역' })).toBeVisible();
  });

  test('guest is redirected from settings to dashboard', async ({ page }) => {
    await enterAsGuest(page);
    await page.goto('/settings');
    await expect(page).toHaveURL('/');
  });

  test('unauthenticated user is sent to login from settings', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL('/login');
  });
});
