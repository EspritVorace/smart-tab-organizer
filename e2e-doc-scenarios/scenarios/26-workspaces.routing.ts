/**
 * Routing manifest for scenario 26 — Workspaces page.
 */
import type { Manifest } from '../../e2e-shared/routing/types.js';

const ALL_LOCALES = ['en', 'fr', 'es'] as const;

export const WORKSPACES_MANIFEST: Manifest = {
  routes: [
    {
      capture: 'workspaces-page',
      destinations: [
        {
          target: 'starlight',
          path: 'workspaces-page',
          locales: [...ALL_LOCALES],
          themes: ['light', 'dark'],
        },
      ],
    },
  ],
};
