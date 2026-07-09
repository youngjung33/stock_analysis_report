import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['../../test/**/*.spec.ts'],
    exclude: ['../../test/e2e/**'],
    globals: true,
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
