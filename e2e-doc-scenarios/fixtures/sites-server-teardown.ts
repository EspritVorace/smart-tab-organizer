/**
 * Playwright `globalTeardown`: stop the mimetic sites HTTP server started in
 * `sites-server-setup.ts`.
 */
import { stopSitesServer } from './sites-server.js';

export default async function globalTeardown(): Promise<void> {
  const server = globalThis.__DOC_SCENARIOS_SITES_SERVER__;
  if (!server) return;
  await stopSitesServer(server);
  globalThis.__DOC_SCENARIOS_SITES_SERVER__ = undefined;
}
