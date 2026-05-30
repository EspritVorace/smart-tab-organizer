/**
 * Routing manifest for scenario 20 — Popup content.
 */
import type { Manifest } from '../../e2e-shared/routing/types.js';

const ALL_LOCALES = ['en', 'fr', 'es'] as const;

export const POPUP_MANIFEST: Manifest = {
  routes: [
    {
      capture: 'popup-content',
      destinations: [
        {
          target: 'starlight',
          path: 'popup-content',
          locales: [...ALL_LOCALES],
          themes: ['light', 'dark'],
        },
      ],
    },
  ],
};
