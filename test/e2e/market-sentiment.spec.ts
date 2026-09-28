import { test, expect } from '@playwright/test';
import { enterAsGuest, ensureKoreanLocale } from './helpers';

test.describe('market sentiment dashboard', () => {
  test.setTimeout(90_000);

  test('guest dashboard shows market sentiment summary section', async ({ page }) => {
    await enterAsGuest(page);
    await ensureKoreanLocale(page);
    await expect(page.getByRole('heading', { name: '시장 정세 요약', level: 2 })).toBeVisible();
    await expect(page.getByRole('link', { name: '상세 분석 →' })).toBeVisible();
    await expect(page.getByText('KOSPI')).toBeVisible({ timeout: 45_000 });
    await expect(page.getByText('NASDAQ')).toBeVisible({ timeout: 45_000 });
  });
});
