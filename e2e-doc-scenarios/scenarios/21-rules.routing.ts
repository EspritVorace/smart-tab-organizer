/**
 * Routing manifest for scenario 21 — Rules feature screens.
 */
import type { Manifest } from '../../e2e-shared/routing/types.js';

const ALL_LOCALES = ['en', 'fr', 'es'] as const;

export const RULES_MANIFEST: Manifest = {
  routes: [
    {
      capture: 'rules-create-step1',
      destinations: [
        {
          target: 'starlight',
          path: 'rules-create-step1',
          locales: [...ALL_LOCALES],
          themes: ['light', 'dark'],
        },
      ],
    },
    {
      capture: 'rules-import-file-dialog',
      destinations: [
        {
          target: 'starlight',
          path: 'rules-import-file-dialog',
          locales: [...ALL_LOCALES],
          themes: ['light', 'dark'],
        },
      ],
    },
    {
      capture: 'rules-bulk-actions',
      destinations: [
        {
          target: 'chrome-web-store',
          path: 'rules-bulk-actions',
          locales: [...ALL_LOCALES],
          themes: ['light', 'dark'],
        },
      ],
    },
  ],
};
