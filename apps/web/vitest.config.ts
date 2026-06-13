import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

const webRoot = path.resolve(__dirname);
const monorepoRoot = path.resolve(__dirname, '../..');

export default defineConfig({
  root: monorepoRoot,
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.join(webRoot, 'src'),
      '@sar/shared': path.join(monorepoRoot, 'packages/shared/src/index.ts'),
      '@web': path.join(webRoot, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['test/web/**/*.spec.ts'],
  },
});
