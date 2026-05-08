/**
 * Routing manifest for `00-main-journey`.
 *
 * Captures are produced under `output/{locale}/{theme}/00-main-journey/` by the
 * scenario runner, and the routes below copy a curated subset to the Starlight
 * assets directory so the rendered docs can reference them via standard
 * `import` statements (cf. MDX files under `docs/src/content/docs/`).
 *
 * Filenames written under each destination follow the convention used by the
 * `e2e-screenshots/` pipeline: `{locale}-{theme}-<capture>.png`. This keeps a
 * single naming scheme across pipelines so MDX authors do not have to know
 * which pipeline produced a given image.
 */
import type { Manifest } from '../../e2e-shared/routing/types.js';

const ALL_LOCALES = ['en', 'fr', 'es'] as const;
const ALL_THEMES = ['dark', 'light'] as const;

export const MAIN_JOURNEY_MANIFEST: Manifest = {
  routes: [
    {
      capture: 'popup-empty',
      destinations: [
        {
          target: 'starlight',
          path: 'journey-popup-empty',
          locales: [...ALL_LOCALES],
          themes: [...ALL_THEMES],
        },
      ],
    },
    {
      capture: 'rules-list-populated',
      destinations: [
        {
          target: 'starlight',
          path: 'journey-rules-list-populated',
          locales: [...ALL_LOCALES],
          themes: [...ALL_THEMES],
        },
      ],
    },
    {
      capture: 'sessions-list-with-snapshot',
      destinations: [
        {
          target: 'starlight',
          path: 'journey-sessions-list-with-snapshot',
          locales: [...ALL_LOCALES],
          themes: [...ALL_THEMES],
        },
      ],
    },
  ],
};
