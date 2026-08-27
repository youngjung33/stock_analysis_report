import { test, expect } from '@playwright/test';
import { enterAsGuest, ensureKoreanLocale } from './helpers';

test.describe('production smoke', () => {
  test.setTimeout(60_000);

  test('login page renders on production server', async ({ page }) => {
    await page.goto('/login');
    await ensureKoreanLocale(page);
    await expect(page.getByRole('button', { name: '로그인' })).toBeVisible();
    await expect(page.getByRole('button', { name: '비회원으로 입장' })).toBeVisible();
  });

  test('guest reaches dashboard', async ({ page }) => {
    await enterAsGuest(page);
    await expect(page.getByRole('heading', { name: '투자 현황', level: 1 })).toBeVisible();
  });

  test('market analysis API returns report payload', async ({ request }) => {
    const res = await request.get('/api/market/analysis');
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as { data?: { fetchedAt?: string } };
    expect(body.data?.fetchedAt).toBeTruthy();
  });
});
