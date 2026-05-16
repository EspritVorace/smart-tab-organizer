import path from 'node:path';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import vitest from '@vitest/eslint-plugin';
import playwright from 'eslint-plugin-playwright';
import sonarjs from 'eslint-plugin-sonarjs';

// Explicit list of SonarJS rules kept at "warn" (CTRF signal without blocking
// the build). Empty by default since #200: historical debt has been paid down
// (see #191 and #192) and any new violation must fail the build.
// Add an entry here only with a comment justifying why the rule is too strict
// for the project (link to the dedicated ticket).
const sonarjsWarnOverrides = {};

// Small local rule: forbids upward relative imports (../...) inside src/ and
// auto-replaces them with the alias @/<path-relative-to-src>.
// Equivalent to `eslint-plugin-no-relative-import-paths` but compatible with
// ESLint 10 (the original still uses context.getCwd(), removed in v9).
const preferAliasImportsRule = {
  meta: {
    type: 'problem',
    fixable: 'code',
    schema: [],
    messages: {
      useAlias:
        "Use the '@/{{aliased}}' alias rather than an upward relative import.",
    },
  },
  create(context) {
    const srcDir = path.resolve(context.cwd, 'src');
    const fileDir = path.dirname(context.filename);

    function visit(node) {
      const source = node.source;
      if (!source || typeof source.value !== 'string') return;
      const spec = source.value;
      if (!spec.startsWith('../')) return;
      const abs = path.resolve(fileDir, spec);
      const rel = path.relative(srcDir, abs);
      if (!rel || rel.startsWith('..')) return;
      const aliased = rel.split(path.sep).join('/');
      const quote = source.raw[0];
      context.report({
        node: source,
        messageId: 'useAlias',
        data: { aliased },
        fix: (fixer) => fixer.replaceText(source, `${quote}@/${aliased}${quote}`),
      });
    }

    return {
      ImportDeclaration: visit,
      ExportAllDeclaration: visit,
      ExportNamedDeclaration: (node) => node.source && visit(node),
    };
  },
};

const localPlugin = {
  rules: { 'prefer-alias-imports': preferAliasImportsRule },
};



const TODO_DISABLED_VITEST = {};

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
    ],
  },

  ...tseslint.configs.recommended,

  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      local: localPlugin,
    },
    rules: {
      // Interdit les imports remontants (../...) dans src/ : utiliser l'alias @/.
      // Auto-fixable avec `pnpm lint:fix`.
      'local/prefer-alias-imports': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  {
    files: ['src/**/*.{ts,tsx}'],
    ...sonarjs.configs.recommended,
    rules: {
      ...sonarjs.configs.recommended.rules,
      ...sonarjsWarnOverrides,
    },
  },

  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
    },
  },

  {
    files: ['src/**/*.tsx'],
    ...jsxA11y.flatConfigs.recommended,
  },

  {
    files: ['src/**/*.tsx'],
    rules: {
      'jsx-a11y/no-aria-hidden-on-focusable': 'error',
      'jsx-a11y/lang': 'error',
    },
  },

  {
    files: ['tests/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
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
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      // Page Objects in e2e-shared/pages expose `expect*` wrapper methods
      // (e.g. `wizard.expectInvalidJsonError()`) that internally call
      // Playwright's `expect`. Teach the rule about that convention so
      // tests written in Page Object style are not flagged as
      // assertion-less.
      'playwright/expect-expect': ['warn', {
        assertFunctionNames: ['expect'],
        assertFunctionPatterns: ['^expect[A-Z]'],
      }],
    },
  },
);
