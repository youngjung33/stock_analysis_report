import { test, expect } from '@playwright/test';
import {
  enterAsGuest,
  ensureKoreanLocale,
  hasMemberE2E,
  loginAsMember,
  MEMBER_E2E_SKIP_REASON,
} from './helpers';

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
    await expect(page.getByRole('heading', { name: '투자 현황', level: 1 })).toBeVisible();
  });

  test('register mode shows signup form', async ({ page }) => {
    await page.goto('/login');
    await ensureKoreanLocale(page);
    await page.getByRole('button', { name: '회원가입' }).click();
    await expect(page.getByRole('button', { name: '회원가입' })).toBeVisible();
    await expect(page.getByText('아이디', { exact: true })).toBeVisible();
    await expect(page.getByText('이메일 (선택)')).toBeVisible();
  });

  test('guest can open transactions page', async ({ page }) => {
    await enterAsGuest(page);
    await page.goto('/transactions');
    await expect(page.getByRole('heading', { name: '매매 등록' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '매매 내역' })).toBeVisible();
  });

  test('guest is redirected from settings to dashboard', async ({ page }) => {
    await enterAsGuest(page);
    await page.goto('/settings');
    await expect(page).toHaveURL('/');
  });

  test('guest can open my-info page', async ({ page }) => {
    await enterAsGuest(page);
    await page.goto('/my-info');
    await expect(page.getByRole('heading', { name: '내 정보' })).toBeVisible();
    await expect(page.getByText('예수금·투자 원금')).toBeVisible();
    await expect(page.getByRole('heading', { name: '매매 등록' }).first()).toBeVisible();
  });

  test('guest sees onboarding on empty dashboard', async ({ page }) => {
    await enterAsGuest(page);
    await expect(page.getByText('투자 내역을 시작해 보세요')).toBeVisible();
    await expect(page.getByRole('link', { name: /내 정보에서 등록하기/ })).toBeVisible();
  });

  test('guest can register initial capital on my-info', async ({ page }) => {
    await enterAsGuest(page);
    await page.goto('/my-info');
    await page.getByPlaceholder('예: 10,000,000').fill('1000000');
    await page.getByRole('button', { name: '투자 원금 설정' }).click();
    await expect(page.getByText('₩1,000,000').first()).toBeVisible({ timeout: 10_000 });
  });

  test('unauthenticated user is sent to login from settings', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/login(\?next=%2Fsettings)?$/);
  });

  test('unauthenticated user is sent to login from dashboard', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/login');
  });

  test('guest can open tax page', async ({ page }) => {
    await enterAsGuest(page);
    await page.goto('/tax');
    await expect(page.getByRole('heading', { name: '세금 정보' })).toBeVisible();
  });

  test('guest can open guide page', async ({ page }) => {
    await enterAsGuest(page);
    await page.goto('/guide');
    await expect(page.getByRole('heading', { name: '주식이용 Tip', level: 1 })).toBeVisible();
  });

  test('guest can open market analysis page', async ({ page }) => {
    await enterAsGuest(page);
    await page.goto('/market/analysis');
    await expect(page.getByRole('heading', { name: '시장 심층 분석' })).toBeVisible();
  });

  test('guest can open investor type survey page', async ({ page }) => {
    await enterAsGuest(page);
    await page.goto('/guide/investor-type');
    await expect(page.getByRole('heading', { name: '투자 유형 진단', level: 1 })).toBeVisible();
  });

  test('guest login returns to next path from middleware redirect', async ({ page }) => {
    await page.goto('/tax');
    await expect(page).toHaveURL(/\/login\?next=%2Ftax/);
    await ensureKoreanLocale(page);
    await page.getByRole('button', { name: '비회원으로 입장' }).click();
    await expect(page).toHaveURL('/tax', { timeout: 15_000 });
  });

  test('member can login with seeded credentials', async ({ page }) => {
    test.skip(!hasMemberE2E(), MEMBER_E2E_SKIP_REASON);

    await loginAsMember(page);
    await expect(page.getByRole('heading', { name: '투자 현황', level: 1 })).toBeVisible();
  });
});
