/**
 * Manifest-driven screenshot routing.
 *
 * A `Manifest` lists the captures produced by a pipeline and where to copy each
 * one (README directory, Chrome Web Store directory, Starlight assets…).
 * Replaces the legacy regex-pattern logic that was hardcoded in
 * `e2e-screenshots/helpers/screenshot-helper.ts`.
 */

export type DestinationTarget = 'starlight' | 'readme' | 'chrome-web-store';

export type Locale = 'en' | 'fr' | 'es';

export type Theme = 'light' | 'dark';

export interface RouteDestination {
  target: DestinationTarget;
  /** Final filename written under the destination root, without extension. */
  path: string;
  /** If omitted, the destination accepts every locale. */
  locales?: Locale[];
  /** If omitted, the destination accepts every theme. */
  themes?: Theme[];
}

export interface Route {
  /** Capture base name, without locale/theme prefix and without `.png` suffix. */
  capture: string;
  destinations: RouteDestination[];
}

export interface Manifest {
  routes: Route[];
}
