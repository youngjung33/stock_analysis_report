# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> smoke >> register mode shows signup form
- Location: ..\..\test\e2e\smoke.spec.ts:26:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('아이디')
Expected: visible
Error: strict mode violation: getByText('아이디') resolved to 2 elements:
    1) <span class="bg-card px-2 text-muted-foreground">또는 아이디로</span> aka getByText('또는 아이디로')
    2) <span class="text-sm text-muted-foreground">아이디</span> aka getByText('아이디', { exact: true })

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('아이디')

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - heading "SAR Portfolio" [level=1] [ref=e5]
      - paragraph [ref=e6]: 회원가입 후 포트폴리오를 관리하세요.
    - paragraph [ref=e7]: 소셜 로그인 불러오는 중...
    - generic [ref=e12]: 또는 아이디로
    - generic [ref=e13]:
      - text: 아이디
      - generic [ref=e14]:
        - 'textbox "아이디 중복 확인 형식: 3~32자, 영문·숫자·밑줄(_)" [ref=e15]'
        - button "중복 확인" [ref=e16] [cursor=pointer]
      - paragraph [ref=e17]: "형식: 3~32자, 영문·숫자·밑줄(_)"
    - generic [ref=e18]:
      - text: 이메일 (선택)
      - textbox "이메일 (선택)" [ref=e19]:
        - /placeholder: name@example.com
    - generic [ref=e20]:
      - text: 비밀번호
      - textbox "비밀번호 8~64자, 영문과 숫자 각 1자 이상" [ref=e21]
      - paragraph [ref=e22]: 8~64자, 영문과 숫자 각 1자 이상
    - generic [ref=e23]:
      - text: 비밀번호 확인
      - textbox "비밀번호 확인" [ref=e24]
    - button "회원가입" [ref=e25] [cursor=pointer]
    - paragraph [ref=e26]:
      - text: 이미 계정이 있으신가요?
      - button "로그인" [active] [ref=e27] [cursor=pointer]
    - generic [ref=e28]:
      - paragraph [ref=e29]: 비회원으로 둘러보기
      - paragraph [ref=e30]: 서버에 저장되지 않으며, 이 브라우저 탭을 닫으면 데이터가 사라집니다.
      - button "비회원으로 입장" [ref=e31] [cursor=pointer]
  - button "Open Next.js Dev Tools" [ref=e37] [cursor=pointer]:
    - img [ref=e38]
  - alert [ref=e41]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | async function enterAsGuest(page: import('@playwright/test').Page) {
  4  |   await page.goto('/login');
  5  |   await page.getByRole('button', { name: '비회원으로 입장' }).click();
  6  |   await expect(page).toHaveURL('/');
  7  | }
  8  | 
  9  | test.describe('smoke', () => {
  10 |   test('login page renders', async ({ page }) => {
  11 |     await page.goto('/login');
  12 |     await expect(page.getByRole('button', { name: '로그인' })).toBeVisible();
  13 |     await expect(page.getByRole('link', { name: '비밀번호를 잊으셨나요?' })).toBeVisible();
  14 |   });
  15 | 
  16 |   test('forgot password page renders', async ({ page }) => {
  17 |     await page.goto('/forgot-password');
  18 |     await expect(page.getByRole('heading', { name: '비밀번호 찾기' })).toBeVisible();
  19 |   });
  20 | 
  21 |   test('guest can open dashboard', async ({ page }) => {
  22 |     await enterAsGuest(page);
  23 |     await expect(page.getByText('포트폴리오 대시보드')).toBeVisible();
  24 |   });
  25 | 
  26 |   test('register mode shows signup form', async ({ page }) => {
  27 |     await page.goto('/login');
  28 |     await page.getByRole('button', { name: '회원가입' }).click();
  29 |     await expect(page.getByRole('button', { name: '회원가입' })).toBeVisible();
> 30 |     await expect(page.getByText('아이디')).toBeVisible();
     |                                         ^ Error: expect(locator).toBeVisible() failed
  31 |     await expect(page.getByText('이메일 (선택)')).toBeVisible();
  32 |   });
  33 | 
  34 |   test('guest can open transactions page', async ({ page }) => {
  35 |     await enterAsGuest(page);
  36 |     await page.goto('/transactions');
  37 |     await expect(page.getByRole('heading', { name: '거래 등록' })).toBeVisible();
  38 |     await expect(page.getByRole('heading', { name: '거래 내역' })).toBeVisible();
  39 |   });
  40 | 
  41 |   test('guest is redirected from settings to dashboard', async ({ page }) => {
  42 |     await enterAsGuest(page);
  43 |     await page.goto('/settings');
  44 |     await expect(page).toHaveURL('/');
  45 |   });
  46 | 
  47 |   test('guest can open my-info page', async ({ page }) => {
  48 |     await enterAsGuest(page);
  49 |     await page.goto('/my-info');
  50 |     await expect(page.getByRole('heading', { name: '내 정보' })).toBeVisible();
  51 |     await expect(page.getByText('자본금 관리')).toBeVisible();
  52 |     await expect(page.getByText('주식 거래')).toBeVisible();
  53 |   });
  54 | 
  55 |   test('guest sees onboarding on empty dashboard', async ({ page }) => {
  56 |     await enterAsGuest(page);
  57 |     await expect(page.getByText('포트폴리오를 시작해 보세요')).toBeVisible();
  58 |     await expect(page.getByRole('link', { name: /내 정보에서 등록하기/ })).toBeVisible();
  59 |   });
  60 | 
  61 |   test('guest can register initial capital on my-info', async ({ page }) => {
  62 |     await enterAsGuest(page);
  63 |     await page.goto('/my-info');
  64 |     await page.getByPlaceholder('예: 10,000,000').fill('1000000');
  65 |     await page.getByRole('button', { name: '초기 자본 설정' }).click();
  66 |     await expect(page.getByText('₩1,000,000').first()).toBeVisible({ timeout: 10_000 });
  67 |   });
  68 | 
  69 |   test('unauthenticated user is sent to login from settings', async ({ page }) => {
  70 |     await page.goto('/settings');
  71 |     await expect(page).toHaveURL('/login');
  72 |   });
  73 | });
  74 | 
```