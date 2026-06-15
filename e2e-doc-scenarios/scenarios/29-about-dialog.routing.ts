/**
 * Routing manifest for scenario 29 — About dialog.
 */
import type { Manifest } from '../../e2e-shared/routing/types.js';

const ALL_LOCALES = ['en', 'fr', 'es'] as const;

export const ABOUT_DIALOG_MANIFEST: Manifest = {
  routes: [
    {
      capture: 'about-dialog',
      destinations: [
        {
          target: 'starlight',
          path: 'about-dialog',
          locales: [...ALL_LOCALES],
          themes: ['light', 'dark'],
        },
      ],
    },
  ],
};
