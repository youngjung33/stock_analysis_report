import { test, expect } from '@playwright/test';
import {
  enterAsGuest,
  ensureKoreanLocale,
  hasMemberE2E,
  loginAsMember,
  MEMBER_E2E_SKIP_REASON,
} from './helpers';

test.describe('AI insight API', () => {
  test.setTimeout(90_000);

  test('stock-analysis requires authentication', async ({ request }) => {
    const res = await request.post('/api/ai/stock-analysis', {
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.0.0.60' },
      data: { symbol: '005930', name: '삼성전자', market: 'KR' },
    });
    expect(res.status()).toBe(401);
  });

  test('portfolio-analysis requires authentication', async ({ request }) => {
    const res = await request.post('/api/ai/portfolio-analysis', {
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.0.0.61' },
      data: { locale: 'ko' },
    });
    expect(res.status()).toBe(401);
  });

  test('ai-credential requires authentication', async ({ request }) => {
    const res = await request.get('/api/account/ai-credential', {
      headers: { 'x-forwarded-for': '10.0.0.62' },
    });
    expect(res.status()).toBe(401);
  });
});

test.describe('AI insight UI', () => {
  test.setTimeout(120_000);

  test('guest sees AI insight panel after selecting stock on market analysis', async ({ page }) => {
    await enterAsGuest(page);
    await page.goto('/market/analysis');
    await ensureKoreanLocale(page);

    await expect(page.getByText('종목 집중 분석 — 왜 이 가격인가?')).toBeVisible({ timeout: 90_000 });

    const searchInput = page.getByPlaceholder('종목명 또는 코드 (예: 삼성전자, 005930)');
    await searchInput.fill('005930');
    await page.getByRole('button', { name: /005930/ }).first().click({ timeout: 30_000 });

    await expect(page.getByText('AI 종목 해석')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole('button', { name: 'AI 해석 받기' })).toBeVisible();
  });

  test('member stock AI API returns enabled flag or insight', async ({ page }) => {
    test.skip(!hasMemberE2E(), MEMBER_E2E_SKIP_REASON);

    await loginAsMember(page);
    const res = await page.request.post('/api/ai/stock-analysis', {
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.0.0.63' },
      data: { symbol: '005930', name: '삼성전자', market: 'KR', locale: 'ko' },
    });

    expect([200, 400]).toContain(res.status());
    const body = await res.json();

    if (res.status() === 200) {
      expect(typeof body.enabled).toBe('boolean');
      if (body.enabled) {
        expect(body.insight?.sections?.length).toBeGreaterThan(0);
      }
    } else {
      expect(body.code).toBeTruthy();
    }
  });

  test('member portfolio AI API returns enabled flag or domain error', async ({ page }) => {
    test.skip(!hasMemberE2E(), MEMBER_E2E_SKIP_REASON);

    await loginAsMember(page);
    const res = await page.request.post('/api/ai/portfolio-analysis', {
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.0.0.64' },
      data: { locale: 'ko' },
    });

    expect([200, 400]).toContain(res.status());
    const body = await res.json();

    if (res.status() === 200) {
      expect(typeof body.enabled).toBe('boolean');
    } else {
      expect(['AI_QUOTA_EXCEEDED', 'AI_CONTEXT_UNAVAILABLE', 'AI_PROVIDER_ERROR', 'AI_DISABLED']).toContain(
        body.code,
      );
    }
  });
});
