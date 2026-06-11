import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import boundaries from 'eslint-plugin-boundaries';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    plugins: { boundaries },
    settings: {
      'boundaries/elements': [
        { type: 'domain', pattern: 'src/domain/**' },
        { type: 'application', pattern: 'src/application/**' },
        { type: 'infrastructure', pattern: 'src/infrastructure/**' },
        { type: 'presentation', pattern: 'src/presentation/**' },
      ],
    },
    rules: {
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            { from: 'domain', allow: ['domain'] },
            { from: 'application', allow: ['domain', 'application'] },
            { from: 'infrastructure', allow: ['domain', 'application', 'infrastructure'] },
            { from: 'presentation', allow: ['domain', 'application', 'presentation'] },
          ],
        },
      ],
    },
  },
);
