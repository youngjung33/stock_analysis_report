import path from 'path';
import { defineConfig } from 'vitest/config';

const sharedSrc = path.resolve(__dirname, '../../packages/shared/src');

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    environment: 'node',
    include: ['../../test/**/*.spec.ts', '../../test/**/*.spec.tsx'],
    exclude: ['../../test/e2e/**', '../../test/shared/**'],
    globals: true,
    env: {
      JWT_ACCESS_SECRET: 'vitest-jwt-access-secret-32-chars-min',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    },
  },
  resolve: {
    alias: [
      { find: '@sar/shared/auth-cookies', replacement: path.join(sharedSrc, 'auth-cookies.ts') },
      { find: '@sar/shared/i18n', replacement: path.join(sharedSrc, 'i18n/index.ts') },
      { find: '@sar/shared/route-access', replacement: path.join(sharedSrc, 'route-access.ts') },
      { find: '@sar/shared/session-cookie', replacement: path.join(sharedSrc, 'session-cookie.ts') },
      { find: '@sar/shared/guest-session-token', replacement: path.join(sharedSrc, 'guest-session-token.ts') },
      { find: '@sar/shared', replacement: path.join(sharedSrc, 'index.ts') },
      { find: '@', replacement: path.resolve(__dirname, './src') },
      { find: '@/client', replacement: path.resolve(__dirname, './src/client') },
      { find: '@server', replacement: path.resolve(__dirname, './src/server') },
    ],
  },
});
