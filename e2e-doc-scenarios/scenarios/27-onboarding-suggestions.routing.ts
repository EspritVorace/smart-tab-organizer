/**
 * Routing manifest for scenario 27 - Onboarding pack suggestions.
 *
 * Routes the contextual onboarding hero feature screen into the Starlight
 * docs (home page). Issue #433.
 */
import type { Manifest } from '../../e2e-shared/routing/types.js';

const ALL_LOCALES = ['en', 'fr', 'es'] as const;

export const ONBOARDING_SUGGESTIONS_MANIFEST: Manifest = {
  routes: [
    {
      capture: 'home-hero-suggestions',
      destinations: [
        {
          target: 'starlight',
          path: 'home-hero-suggestions',
          locales: [...ALL_LOCALES],
          themes: ['light', 'dark'],
        },
      ],
    },
  ],
};
