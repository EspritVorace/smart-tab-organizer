/**
 * Routing manifest for scenario 24 — Statistics overview.
 */
import type { Manifest } from '../../e2e-shared/routing/types.js';

const ALL_LOCALES = ['en', 'fr', 'es'] as const;

export const STATISTICS_MANIFEST: Manifest = {
  routes: [
    {
      capture: 'statistics-overview',
      destinations: [
        {
          target: 'starlight',
          path: 'statistics-overview',
          locales: [...ALL_LOCALES],
          themes: ['light', 'dark'],
        },
      ],
    },
  ],
};
