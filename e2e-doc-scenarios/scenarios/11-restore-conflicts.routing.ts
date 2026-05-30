/**
 * Routing manifest for `11-restore-conflicts`.
 *
 * The conflict-resolution capture doubles as the Starlight documentation's
 * and the Chrome Web Store's `sessions-restore-conflict` screen (the
 * destination filename is driven by `path`, independent of the capture step
 * name).
 */
import type { Manifest } from '../../e2e-shared/routing/types.js';

const ALL_LOCALES = ['en', 'fr', 'es'] as const;

export const RESTORE_CONFLICTS_MANIFEST: Manifest = {
  routes: [
    {
      capture: 'restore-wizard-conflict-resolution',
      destinations: [
        {
          target: 'starlight',
          path: 'sessions-restore-conflict',
          locales: [...ALL_LOCALES],
          themes: ['light', 'dark'],
        },
        {
          target: 'chrome-web-store',
          path: 'sessions-restore-conflict',
          locales: [...ALL_LOCALES],
          themes: ['dark'],
        },
      ],
    },
  ],
};
