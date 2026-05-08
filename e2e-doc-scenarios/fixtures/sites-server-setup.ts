/**
 * Playwright `globalSetup`: start the mimetic sites HTTP server before any
 * scenario runs and remember the instance for teardown.
 */
import { startSitesServer } from './sites-server.js';

declare global {
  var __DOC_SCENARIOS_SITES_SERVER__: import('http').Server | undefined;
}

export default async function globalSetup(): Promise<void> {
  if (globalThis.__DOC_SCENARIOS_SITES_SERVER__) return;
  globalThis.__DOC_SCENARIOS_SITES_SERVER__ = await startSitesServer();
  console.log('  → mimetic sites server listening on http://127.0.0.1:4173');
}
