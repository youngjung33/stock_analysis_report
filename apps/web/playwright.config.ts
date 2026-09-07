import path from 'path';
import { config as loadEnv } from 'dotenv';
import { defineConfig, devices } from '@playwright/test';
import { E2E_PLACEHOLDER_DATABASE_URL } from '../../test/e2e/member-e2e-env';

loadEnv({ path: path.resolve(__dirname, '.env') });

const e2eDatabaseUrl =
  process.env.DATABASE_URL?.trim() || E2E_PLACEHOLDER_DATABASE_URL;

export default defineConfig({
  testDir: '../../test/e2e',
  globalSetup: '../../test/e2e/global-setup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
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
    command: 'npm run dev',
    url: 'http://127.0.0.1:3000/login',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      JWT_ACCESS_SECRET:
        process.env.JWT_ACCESS_SECRET ?? 'e2e-jwt-access-secret-min-32-chars',
      DATABASE_URL: e2eDatabaseUrl,
    },
  },
});
