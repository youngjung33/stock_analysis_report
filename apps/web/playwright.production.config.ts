import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '../../test/e2e',
  testMatch: 'production-smoke.spec.ts',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:3000',
    extraHTTPHeaders: {
      'Accept-Language': 'ko-KR,ko;q=0.9',
    },
    storageState: {
      cookies: [
        {
          name: 'sar_locale',
          value: 'ko',
          domain: '127.0.0.1',
          path: '/',
          expires: -1,
          httpOnly: false,
          secure: false,
          sameSite: 'Lax',
        },
      ],
      origins: [],
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run start',
    url: 'http://127.0.0.1:3000/login',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      JWT_ACCESS_SECRET:
        process.env.JWT_ACCESS_SECRET ?? 'e2e-jwt-access-secret-min-32-chars',
      DATABASE_URL:
        process.env.DATABASE_URL ?? 'postgresql://test:test@localhost:5432/test',
    },
  },
});
