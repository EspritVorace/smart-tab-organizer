/**
 * Routing manifest for scenario 22 — Sessions feature screens.
 */
import type { Manifest } from '../../e2e-shared/routing/types.js';

const ALL_LOCALES = ['en', 'fr', 'es'] as const;

export const SESSIONS_MANIFEST: Manifest = {
  routes: [
    {
      capture: 'sessions-list',
      destinations: [
        {
          target: 'readme',
          path: 'sessions-list',
          locales: [...ALL_LOCALES],
          themes: ['dark'],
        },
      ],
    },
    {
      capture: 'sessions-create-snapshot',
      destinations: [
        {
          target: 'starlight',
          path: 'sessions-create-snapshot',
          locales: [...ALL_LOCALES],
          themes: ['light', 'dark'],
        },
      ],
    },
    {
      capture: 'sessions-search-deep',
      destinations: [
        {
          target: 'chrome-web-store',
          path: 'sessions-search-deep',
          locales: [...ALL_LOCALES],
          themes: ['dark'],
        },
      ],
    },
  ],
};
