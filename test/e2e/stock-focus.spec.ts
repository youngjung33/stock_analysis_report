import { test, expect } from '@playwright/test';
import { enterAsGuest, ensureKoreanLocale } from './helpers';

test.describe('stock focus analysis', () => {
  test.setTimeout(120_000);

  test('guest can open stock detail page with market query', async ({ page }) => {
    await enterAsGuest(page);
    await page.goto('/stocks/005930?market=KR');
    await expect(page.getByRole('heading', { name: '삼성전자' })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('img', { name: '종목 가격 차트' })).toBeVisible({ timeout: 30_000 });
  });

  test('stock-analysis API returns report for valid params', async ({ request }) => {
    const res = await request.get(
      '/api/market/stock-analysis?symbol=005930&name=%EC%82%BC%EC%84%B1%EC%A0%84%EC%9E%90&market=KR',
      { headers: { 'x-forwarded-for': '10.0.0.30' } },
    );

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.symbol).toBe('005930');
    expect(Array.isArray(body.insights)).toBe(true);
    expect(body.insights.some((i: { category: string }) => i.category === 'stockAction')).toBe(true);
  });

  test('stock-analysis API rejects missing name param', async ({ request }) => {
    const res = await request.get('/api/market/stock-analysis?symbol=005930&market=KR', {
      headers: { 'x-forwarded-for': '10.0.0.31' },
    });

    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test('guest can load stock focus section on market analysis page', async ({ page }) => {
    await enterAsGuest(page);
    await page.goto('/market/analysis');
    await ensureKoreanLocale(page);

    await expect(page.getByRole('heading', { name: '시장 심층 분석' })).toBeVisible();
    await expect(page.getByText('종목 집중 분석 — 왜 이 가격인가?')).toBeVisible({ timeout: 90_000 });
    await expect(page.getByText('원칙: 가격·차트가 먼저')).toBeVisible();
  });

  test('guest can search stock and see reference action insight', async ({ page }) => {
    await enterAsGuest(page);
    await page.goto('/market/analysis');
    await ensureKoreanLocale(page);

    await expect(page.getByText('종목 집중 분석 — 왜 이 가격인가?')).toBeVisible({ timeout: 90_000 });

    const searchInput = page.getByPlaceholder('종목명 또는 코드 (예: 삼성전자, 005930)');
    await searchInput.fill('005930');
    await page.getByRole('button', { name: /005930/ }).first().click({ timeout: 30_000 });

    await expect(page.getByText('참고만 — 투자 권유·매매 지시 아님')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText('참고 의견', { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /차트 상세/ })).toBeVisible();
  });
});
