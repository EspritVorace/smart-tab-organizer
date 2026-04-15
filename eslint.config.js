import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import vitest from '@vitest/eslint-plugin';
import playwright from 'eslint-plugin-playwright';

// TODO: règles désactivées temporairement (violations existantes non auto-fixables).
// À réactiver progressivement après correction manuelle.
const TODO_DISABLED_RULES = {
  // TODO(eslint): 231 occurrences à typer correctement
  '@typescript-eslint/no-explicit-any': 'off',
  // TODO(eslint): 98 occurrences (imports, catch, destructuring)
  '@typescript-eslint/no-unused-vars': 'off',
};

const TODO_DISABLED_PLAYWRIGHT = {
  // TODO(eslint): 88 occurrences, remplacer par waitFor/expect().toPass()
  'playwright/no-wait-for-timeout': 'off',
  // TODO(eslint): 11 occurrences, refactorer les tests conditionnels
  'playwright/no-conditional-in-test': 'off',
  // TODO(eslint): 5 occurrences
  'playwright/no-conditional-expect': 'off',
  // TODO(eslint): 2 occurrences, réordonner les hooks
  'playwright/prefer-hooks-in-order': 'off',
};

const TODO_DISABLED_VITEST = {
  // API inexistante dans vitest 2.x
  'vitest/prefer-called-exactly-once-with': 'off',
  // TODO(eslint): 2 occurrences
  'vitest/no-conditional-expect': 'off',
};

const TODO_DISABLED_HOOKS = {
  // TODO(eslint): 4 warnings à vérifier
  'react-hooks/exhaustive-deps': 'off',
};

export default tseslint.config(
  {
    ignores: [
      '.wxt/**',
      '.output/**',
      'node_modules/**',
      'dist/**',
      'coverage/**',
      'ctrf/**',
      'docs/**',
      'storybook-static/**',
      'src/**/*.stories.{ts,tsx}',
      'src/stories/**',
    ],
  },

  ...tseslint.configs.recommended,

  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
  },

  {
    rules: {
      ...TODO_DISABLED_RULES,
      ...TODO_DISABLED_HOOKS,
    },
  },

  {
    files: ['src/**/*.tsx'],
    ...jsxA11y.flatConfigs.recommended,
  },

  {
    files: ['tests/**/*.test.{ts,tsx}', 'tests/setup*.ts'],
    plugins: { vitest },
    rules: {
      ...vitest.configs.recommended.rules,
      ...TODO_DISABLED_VITEST,
    },
  },

  {
    files: ['tests/e2e/**/*.spec.ts', 'tests/e2e/helpers/**/*.ts'],
    ...playwright.configs['flat/recommended'],
  },
  {
    files: ['tests/e2e/**/*.spec.ts', 'tests/e2e/helpers/**/*.ts'],
    rules: TODO_DISABLED_PLAYWRIGHT,
  },
);
