/**
 * Routing manifest for `10-import-conflicts`.
 *
 * The Import/Export overview capture (`import-export-with-rules`) feeds the
 * Starlight `import-export-overview` hub screen, and the default-conflict-mode
 * classification capture doubles as the `rules-import-text-conflicts` screen
 * (the destination filename is driven by `path`, independent of the capture
 * step name).
 */
import type { Manifest } from '../../e2e-shared/routing/types.js';

const ALL_LOCALES = ['en', 'fr', 'es'] as const;

export const IMPORT_CONFLICTS_MANIFEST: Manifest = {
  routes: [
    {
      capture: 'import-export-with-rules',
      destinations: [
        {
          target: 'starlight',
          path: 'import-export-overview',
          locales: [...ALL_LOCALES],
          themes: ['light', 'dark'],
        },
      ],
    },
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
