/**
 * Routing manifest for scenario 24 — Statistics overview.
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

export const STATISTICS_MANIFEST: Manifest = {
  routes: [
    starlightRoute('statistics-overview', 'statistics-overview'),
    starlightRoute('statistics-rules', 'statistics-rules'),
    starlightRoute('statistics-sessions', 'statistics-sessions'),
    starlightRoute('statistics-storage', 'statistics-storage'),
  ],
};
