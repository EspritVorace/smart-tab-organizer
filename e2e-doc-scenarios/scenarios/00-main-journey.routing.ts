/**
 * Routing manifest for `00-main-journey`.
 *
 * Phase 1 ships the manifest empty: captures land in `output/` only.
 * Routes can be added incrementally once visual review is complete, e.g.:
 *
 *   { capture: 'rules-list-populated',
 *     destinations: [{ target: 'starlight', path: 'features/rules/list', themes: ['dark'] }] }
 */
import type { Manifest } from '../../e2e-shared/routing/types.js';

export const MAIN_JOURNEY_MANIFEST: Manifest = {
  routes: [],
};
