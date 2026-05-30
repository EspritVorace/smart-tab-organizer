/**
 * Routing manifest for scenario 25 — Chrome Web Store popup overview.
 */
import type { Manifest } from '../../e2e-shared/routing/types.js';

const ALL_LOCALES = ['en', 'fr', 'es'] as const;

export const STORE_OVERVIEW_MANIFEST: Manifest = {
  routes: [
    {
      capture: 'popup-store-overview',
      destinations: [
        {
          target: 'chrome-web-store',
          path: 'popup-store-overview',
          locales: [...ALL_LOCALES],
          themes: ['light'],
        },
      ],
    },
  ],
};
