import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    environment: 'node',
    include: ['../../test/**/*.spec.ts', '../../test/**/*.spec.tsx'],
    exclude: ['../../test/e2e/**'],
    globals: true,
    env: {
      JWT_ACCESS_SECRET: 'vitest-jwt-access-secret-32-chars-min',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/client': path.resolve(__dirname, './src/client'),
      '@server': path.resolve(__dirname, './src/server'),
      '@sar/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
});
