/**
 * Routing manifest for scenario 28 — Exploration catalogue.
 */
import type { Manifest } from '../../e2e-shared/routing/types.js';

const ALL_LOCALES = ['en', 'fr', 'es'] as const;

const starlightRoute = (capture: string, path: string) => ({
  capture,
  destinations: [
    {
      target: 'starlight' as const,
      path,
      locales: [...ALL_LOCALES],
      themes: ['light', 'dark'] as const,
    },
  ],
});

export const EXPLORATION_MANIFEST: Manifest = {
  routes: [
    starlightRoute('exploration-overview', 'exploration-overview'),
  ],
};
