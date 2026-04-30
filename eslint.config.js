import path from 'node:path';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import vitest from '@vitest/eslint-plugin';
import playwright from 'eslint-plugin-playwright';
import sonarjs from 'eslint-plugin-sonarjs';

// Liste explicite des règles SonarJS conservées en "warn" (signal CTRF sans
// blocage). Vide par défaut depuis #200 : la dette historique a été résorbée
// (voir #191 et #192) et toute nouvelle violation doit échouer le build.
// Ajouter une entrée ici uniquement avec un commentaire justifiant pourquoi
// la règle est trop stricte pour le projet (lien vers le ticket dédié).
const sonarjsWarnOverrides = {};

// Petite règle locale : interdit les imports remontants (../...) dans src/
// et les remplace automatiquement par l'alias @/<chemin-relatif-à-src>.
// Équivalent de `eslint-plugin-no-relative-import-paths` mais compatible
// ESLint 10 (ce dernier utilise encore context.getCwd(), supprimé en v9).
const preferAliasImportsRule = {
  meta: {
    type: 'problem',
    fixable: 'code',
    schema: [],
    messages: {
      useAlias:
        "Utiliser l'alias '@/{{aliased}}' plutôt qu'un import relatif remontant.",
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
  },
);
