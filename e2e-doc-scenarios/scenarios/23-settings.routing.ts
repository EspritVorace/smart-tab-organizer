/**
 * Routing manifest for scenario 23 — Settings page.
 */
import type { Manifest } from '../../e2e-shared/routing/types.js';

const ALL_LOCALES = ['en', 'fr', 'es'] as const;

export const SETTINGS_MANIFEST: Manifest = {
  routes: [
    {
      capture: 'settings-misc',
      destinations: [
        {
          target: 'starlight',
          path: 'settings-misc',
          locales: [...ALL_LOCALES],
          themes: ['light', 'dark'],
        },
      ],
    },
  ],
};
