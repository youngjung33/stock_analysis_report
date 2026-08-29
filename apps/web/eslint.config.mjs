import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: ['.next/**', 'node_modules/**', 'out/**', 'coverage/**', 'dist/**', 'next-env.d.ts'],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    files: [
      'src/presentation/features/**/*.{ts,tsx}',
      'src/presentation/pages/**/*.{ts,tsx}',
      'src/presentation/hooks/**/*.{ts,tsx}',
      'src/presentation/components/**/*.{ts,tsx}',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/client/data/*', '@/server/*', '@/server/**'],
              message:
                'Presentation must use client/domain or useServices — not data/server layers directly.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/client/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/server/*', '@/server/**', '@/presentation/*', '@/presentation/**'],
              message: 'Client layer must not import server or presentation modules.',
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
