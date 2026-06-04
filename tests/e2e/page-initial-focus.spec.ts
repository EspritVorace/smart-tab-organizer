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
import type { Page } from '@playwright/test';
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

  test('focuses the snapshot button when there are no sessions', async ({
    extensionContext,
    extensionId,
  }) => {
    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await expect(page.getByTestId('page-sessions-btn-snapshot')).toBeFocused();

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
