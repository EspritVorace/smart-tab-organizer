/**
 * E2E tests for initial focus when arriving on a list page.
 *
 * Rule (US focus-management-page-load):
 *   - Domain Rules: focus the first rule card when rules exist, otherwise the
 *     "import a pack" button.
 *   - Sessions: focus the first session card (pinned first, then unpinned)
 *     when sessions exist, otherwise the empty-state snapshot button.
 *   - Workspaces: there is always at least one workspace, so focus the first
 *     workspace row.
 *
 * Powered by the `autoFocus` option of useListNavigation.
 */
import { test, expect } from './fixtures';
import type { BrowserContext, Page } from '@playwright/test';
import { SessionsListPage, WorkspaceListPage } from '../../e2e-shared/pages/index.js';
import { goToDomainRulesSection, goToSessionsSection } from './helpers/navigation';
import {
  seedSessions,
  clearSessions,
  createTestSession,
  createPinnedSession,
} from './helpers/seed';

async function goToWorkspacesSection(page: Page, extensionId: string): Promise<void> {
  await page.goto(`chrome-extension://${extensionId}/options.html#workspaces`);
  await page.waitForLoadState('domcontentloaded');
  await new WorkspaceListPage(page).list().waitFor({ state: 'visible', timeout: 10_000 });
}

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

/** Persist the per-section sessions view state (sort/filter) in storage.local. */
async function setSessionsViewState(
  context: BrowserContext,
  value: { filterCategories: string[]; sort: string; sortDirection: string },
): Promise<void> {
  const sw = await getServiceWorker(context);
  await sw.evaluate(v => chrome.storage.local.set({ sessionsViewState: v }), value);
  await new Promise(r => setTimeout(r, 100));
}

/** The persisted view state leaks between tests in the same worker; reset it. */
async function resetSessionsViewState(context: BrowserContext): Promise<void> {
  const sw = await getServiceWorker(context).catch(() => null);
  if (sw) {
    await sw.evaluate(() =>
      chrome.storage.local.remove(['sessionsViewState', 'archivedSessionsViewState']),
    );
  }
}

// ---------------------------------------------------------------------------
// Domain Rules
// ---------------------------------------------------------------------------

test.describe('[focus-management] Domain Rules initial focus', () => {
  test.beforeEach(async ({ helpers }) => {
    await helpers.clearDomainRules();
  });

  test('focuses the first rule card when rules exist', async ({
    extensionContext,
    extensionId,
    helpers,
  }) => {
    await helpers.addDomainRule({ label: 'FirstRule', domainFilter: '*.first.com' });
    await helpers.addDomainRule({ label: 'SecondRule', domainFilter: '*.second.com' });

    const page = await extensionContext.newPage();
    await goToDomainRulesSection(page, extensionId);

    await expect(
      page.getByTestId('page-rules-list').getByRole('listitem').first(),
    ).toBeFocused();

    await page.close();
  });

  test('focuses the import-pack button when there are no rules', async ({
    extensionContext,
    extensionId,
  }) => {
    const page = await extensionContext.newPage();
    await goToDomainRulesSection(page, extensionId);

    await expect(page.getByTestId('page-rules-btn-import-pack')).toBeFocused();

    await page.close();
  });

  test('re-applies focus when navigating away and back', async ({
    extensionContext,
    extensionId,
    helpers,
  }) => {
    await helpers.addDomainRule({ label: 'FirstRule', domainFilter: '*.first.com' });

    const page = await extensionContext.newPage();
    await goToDomainRulesSection(page, extensionId);

    const firstCard = page.getByTestId('page-rules-list').getByRole('listitem').first();
    await expect(firstCard).toBeFocused();

    // Navigate away (home) and back via the sidebar: the page remounts, so the
    // initial-focus guard resets and the first card is focused again.
    await page.getByTestId('sidebar-nav-item-home').click();
    await page.getByTestId('sidebar-nav-item-rules').click();

    await expect(firstCard).toBeFocused();

    await page.close();
  });
});

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

test.describe('[focus-management] Sessions initial focus', () => {
  test.beforeEach(async ({ extensionContext }) => {
    await clearSessions(extensionContext);
    await resetSessionsViewState(extensionContext);
  });

  test('focuses the first (pinned) session card when sessions exist', async ({
    extensionContext,
    extensionId,
  }) => {
    const pinned = createPinnedSession({ name: 'Pinned One' });
    const normal = createTestSession({ name: 'Normal One' });
    await seedSessions(extensionContext, [pinned, normal]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    const firstCard = new SessionsListPage(page).firstCard();
    await expect(firstCard).toBeFocused();
    // It must be the pinned session, not the normal one.
    await expect(firstCard).toHaveAttribute('data-session-id', pinned.id);

    await page.close();
  });

  test('focuses the first sorted card when a date sort is persisted (no pinned sessions)', async ({
    extensionContext,
    extensionId,
  }) => {
    const base = Date.parse('2026-01-01T00:00:00.000Z');
    const iso = (offsetMs: number) => new Date(base + offsetMs).toISOString();
    const oldest = createTestSession({ name: 'Oldest', createdAt: iso(0), updatedAt: iso(0) });
    const middle = createTestSession({ name: 'Middle', createdAt: iso(60_000), updatedAt: iso(60_000) });
    const newest = createTestSession({ name: 'Newest', createdAt: iso(120_000), updatedAt: iso(120_000) });

    // Seed in an order that does NOT match the sorted order: the manual order
    // would put `oldest` first, so a stale (pre-sort) autofocus would land on
    // it instead of `newest`.
    await seedSessions(extensionContext, [oldest, middle, newest]);
    await setSessionsViewState(extensionContext, {
      filterCategories: [],
      sort: 'date',
      sortDirection: 'desc',
    });

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    const firstCard = new SessionsListPage(page).firstCard();
    await expect(firstCard).toBeFocused();
    // date desc => newest first; the focus must wait for the persisted sort and
    // land on `newest`, not on the first card of the manual order.
    await expect(firstCard).toHaveAttribute('data-session-id', newest.id);

    await page.close();
  });

  test('focuses the snapshot button when there are no sessions', async ({
    extensionContext,
    extensionId,
  }) => {
    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await expect(page.getByTestId('page-sessions-btn-snapshot')).toBeFocused();

    await page.close();
  });

  test('re-focuses the first card when switching between the active and archived sub-tabs', async ({
    extensionContext,
    extensionId,
  }) => {
    const pinned = createPinnedSession({ name: 'Pinned One' });
    const normal = createTestSession({ name: 'Normal One' });
    const archived = createTestSession({ name: 'Archived One', isArchived: true });
    await seedSessions(extensionContext, [pinned, normal, archived]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);
    const sessions = new SessionsListPage(page);

    // Initial arrival focuses the first (pinned) card.
    await expect(sessions.card(pinned.id)).toBeFocused();

    // Switching to the archived sub-tab lands on its first card.
    await sessions.archivedTab().click();
    await expect(sessions.archivedList()).toBeVisible();
    await expect(sessions.card(archived.id)).toBeFocused();

    // Switching back to the active sub-tab returns focus to the first card.
    await sessions.activeTab().click();
    await expect(sessions.list()).toBeVisible();
    await expect(sessions.card(pinned.id)).toBeFocused();

    await page.close();
  });
});

// ---------------------------------------------------------------------------
// Workspaces
// ---------------------------------------------------------------------------

test.describe('[focus-management] Workspaces initial focus', () => {
  test('focuses the first workspace row on arrival', async ({
    extensionContext,
    extensionId,
  }) => {
    const page = await extensionContext.newPage();
    await goToWorkspacesSection(page, extensionId);

    await expect(new WorkspaceListPage(page).firstCard()).toBeFocused();

    await page.close();
  });
});
