/**
 * Routing manifest for `10-import-conflicts`.
 *
 * The default-conflict-mode classification capture doubles as the Starlight
 * documentation's `rules-import-text-conflicts` screen (the destination
 * filename is driven by `path`, independent of the capture step name).
 */
import type { Manifest } from '../../e2e-shared/routing/types.js';

const ALL_LOCALES = ['en', 'fr', 'es'] as const;

export const IMPORT_CONFLICTS_MANIFEST: Manifest = {
  routes: [
    {
      capture: 'import-wizard-classification-overwrite',
      destinations: [
        {
          target: 'starlight',
          path: 'rules-import-text-conflicts',
          locales: [...ALL_LOCALES],
          themes: ['light', 'dark'],
        },
      ],
    },
  ],
};
