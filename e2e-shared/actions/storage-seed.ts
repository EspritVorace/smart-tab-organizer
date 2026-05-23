/**
 * Storage-seeding helpers shared between the functional and narrative
 * pipelines. Each action talks to the extension service worker directly
 * (no UI), which is the fastest way to put `chrome.storage.local` in a
 * known state before exercising the UI under test.
 *
 * These helpers intentionally accept generic payloads (`T[]`) to avoid a
 * dependency on the project's Zod types here: callers ship the exact
 * shape they want to store, and the matching schema validation is left
 * to the runtime path that consumes the data (background, hooks).
 *
 * Used by `e2e-doc-scenarios/` satellite scenarios that need to land on
 * a populated state quickly (e.g. 4 seeded rules, a single session with
 * specific group titles). The functional `tests/e2e/` pipeline uses the
 * `helpers` fixture for the same purpose; both code paths converge on
 * `chrome.storage.local.set` under the hood.
 */
import type { BrowserContext } from '@playwright/test';
import { waitForServiceWorker } from '../extension-id.js';

// Minimal Chrome typings (the shared bundle does not depend on `@types/chrome`).
declare const chrome: {
  storage: {
    local: {
      clear(): Promise<void>;
      set(items: Record<string, unknown>): Promise<void>;
    };
  };
};

/** Wipe the extension's `chrome.storage.local` before a scenario starts. */
export async function clearExtensionStorage(context: BrowserContext): Promise<void> {
  const sw = await waitForServiceWorker(context);
  await sw.evaluate(async () => {
    await chrome.storage.local.clear();
  });
}

/** Seed `domainRules` directly into `chrome.storage.local`. */
export async function seedDomainRules<T>(
  context: BrowserContext,
  rules: T[],
): Promise<void> {
  const sw = await waitForServiceWorker(context);
  await sw.evaluate(async (data) => {
    await chrome.storage.local.set({ domainRules: data });
  }, rules as unknown as Parameters<typeof sw.evaluate>[1]);
}

/** Seed sessions directly into `chrome.storage.local`, partitioning them
 * across the three workspace-scoped buckets (`pinnedSessions`, `sessions`,
 * `archivedSessions`) the runtime now expects. Also flips the per-workspace
 * archive-split migration flag so the background's migration leaves the
 * seeded data alone. */
export async function seedSessions<T>(
  context: BrowserContext,
  sessions: T[],
): Promise<void> {
  const sw = await waitForServiceWorker(context);
  await sw.evaluate(async (data) => {
    type SeedSession = { isPinned?: boolean; isArchived?: boolean };
    const all = data as SeedSession[];
    const pinned: SeedSession[] = [];
    const active: SeedSession[] = [];
    const archived: SeedSession[] = [];
    for (const session of all) {
      if (session.isArchived) archived.push(session);
      else if (session.isPinned) pinned.push(session);
      else active.push(session);
    }
    await chrome.storage.local.set({
      pinnedSessions: pinned,
      sessions: active,
      archivedSessions: archived,
      sessionsArchiveSplitDone: true,
    });
  }, sessions as unknown as Parameters<typeof sw.evaluate>[1]);
}
