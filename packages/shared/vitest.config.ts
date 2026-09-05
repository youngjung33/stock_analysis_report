import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['../../test/shared/**/*.spec.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@sar/shared': path.resolve(__dirname, './src/index.ts'),
    },
  },
});
