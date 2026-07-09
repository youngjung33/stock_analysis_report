import { test, expect } from '@playwright/test';

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
    await page.goto('/login');
    await page.getByRole('button', { name: '비회원으로 입장' }).click();
    await expect(page).toHaveURL('/');
    await expect(page.getByText('포트폴리오 대시보드')).toBeVisible();
  });
});
