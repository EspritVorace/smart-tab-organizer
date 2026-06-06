/**
 * E2E test for the Sessions view menu (filter / sort) focus behavior.
 *
 * Accessibility rule: after the user applies a filter or sort and the menu
 * closes, keyboard focus moves to the first resulting card, so a keyboard /
 * screen-reader user lands on the first visible result.
 */
import { type BrowserContext, type Page } from '@playwright/test';
import { test, expect } from './fixtures';
import { goToSessionsSection } from './helpers/navigation';
import { seedSessions, clearSessions, createTestSession } from './helpers/seed';
import { SessionsListPage } from '../../e2e-shared/pages/index.js';

async function getServiceWorker(context: BrowserContext): Promise<Page> {
  let sw = context.serviceWorkers()[0];
  if (sw) return sw as unknown as Page;
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    sw = context.serviceWorkers()[0];
    if (sw) return sw as unknown as Page;
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error('Service worker not available after 5 s (idle termination?)');
}

/** Reset the persisted per-section view state (leaks between tests in a worker). */
async function resetSessionsViewState(context: BrowserContext): Promise<void> {
  const sw = await getServiceWorker(context).catch(() => null);
  if (sw) {
    await sw.evaluate(() =>
      chrome.storage.local.remove(['sessionsViewState', 'archivedSessionsViewState']),
    );
  }
}

/** Click a radio menu item and wait until it reports the checked state. */
async function selectMenuItem(page: Page, testId: string): Promise<void> {
  const item = page.getByTestId(testId);
  await expect(item).toBeVisible();
  await item.click();
  await expect(item).toHaveAttribute('data-state', 'checked');
}

test.beforeEach(async ({ extensionContext }) => {
  await clearSessions(extensionContext);
  await resetSessionsViewState(extensionContext);
});

test.describe('[Sessions-view-menu] focus the first result after applying a sort', () => {
  test('moves focus to the first sorted card when the menu closes', async ({
    extensionContext,
    extensionId,
  }) => {
    const base = Date.parse('2026-01-01T00:00:00.000Z');
    const iso = (offsetMs: number) => new Date(base + offsetMs).toISOString();
    const newest = createTestSession({ name: 'Newest', createdAt: iso(120_000), updatedAt: iso(120_000) });
    const middle = createTestSession({ name: 'Middle', createdAt: iso(60_000), updatedAt: iso(60_000) });
    const oldest = createTestSession({ name: 'Oldest', createdAt: iso(0), updatedAt: iso(0) });

    // Manual (seed) order puts `newest` first, so the arrival autofocus lands
    // on it. After sorting by date ascending, `oldest` becomes first.
    await seedSessions(extensionContext, [newest, middle, oldest]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);
    const sessions = new SessionsListPage(page);

    // Manual order puts `newest` first on arrival.
    await sessions.firstCard().waitFor({ state: 'visible' });
    await expect(sessions.firstCard()).toHaveAttribute('data-session-id', newest.id);

    // Apply a date sort (ascending by default) on the normal section.
    await page.getByTestId('page-sessions-view-unpinned-btn').click();
    await selectMenuItem(page, 'page-sessions-view-unpinned-sort-date');

    // Close the menu: focus must move to the first resulting card (oldest),
    // not stay on the menu trigger.
    await page.keyboard.press('Escape');
    // allow-inline-dom: generic Radix menu-state probe, not a Page Object surface.
    await expect(page.locator('[role="menu"][data-state="open"]')).toHaveCount(0);

    const firstCard = sessions.firstCard();
    await expect(firstCard).toHaveAttribute('data-session-id', oldest.id);
    await expect(firstCard).toBeFocused();

    await page.close();
  });
});
