/**
 * Routing manifest for `e2e-screenshots/`.
 *
 * Reproduces the legacy `README_PATTERNS` and `CHROME_STORE_PATTERNS` regex
 * arrays previously hardcoded in `helpers/screenshot-helper.ts`. Every entry
 * documents which captures are copied to `doc/readme/` and `doc/chrome-web-store/`
 * and for which (locale, theme) combinations.
 *
 * Adding a new entry to a README or the Chrome Web Store listing should be
 * done here, not by editing the screenshot helper.
 */
import type { Manifest } from '../e2e-shared/routing/types.js';

const ALL_LOCALES = ['en', 'fr', 'es'] as const;

export const SCREENSHOTS_MANIFEST: Manifest = {
  routes: [
    {
      capture: 'rules-create-summary',
      destinations: [
        {
          target: 'readme',
          path: 'rules-create-summary',
          locales: [...ALL_LOCALES],
          themes: ['dark'],
        },
      ],
    },
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
      capture: 'sessions-search-deep',
      destinations: [
        {
          target: 'readme',
          path: 'sessions-search-deep',
          locales: [...ALL_LOCALES],
          themes: ['dark'],
        },
        {
          target: 'chrome-web-store',
          path: 'sessions-search-deep',
          locales: [...ALL_LOCALES],
          themes: ['dark'],
        },
      ],
    },
    {
      capture: 'rules-import-text-conflicts',
      destinations: [
        {
          target: 'readme',
          path: 'rules-import-text-conflicts',
          locales: [...ALL_LOCALES],
          themes: ['dark'],
        },
      ],
    },
    {
      capture: 'popup-content',
      destinations: [
        {
          target: 'readme',
          path: 'popup-content',
          locales: [...ALL_LOCALES],
          themes: ['dark'],
        },
      ],
    },
    {
      capture: 'rules-bulk-actions',
      destinations: [
        {
          target: 'chrome-web-store',
          path: 'rules-bulk-actions',
          locales: [...ALL_LOCALES],
          themes: ['light', 'dark'],
        },
      ],
    },
    {
      capture: 'sessions-restore-conflict',
      destinations: [
        {
          target: 'chrome-web-store',
          path: 'sessions-restore-conflict',
          locales: [...ALL_LOCALES],
          themes: ['dark'],
        },
      ],
    },
    {
      capture: 'popup-overview',
      destinations: [
        {
          target: 'chrome-web-store',
          path: 'popup-overview',
          locales: [...ALL_LOCALES],
          themes: ['light'],
        },
      ],
    },
  ],
};
