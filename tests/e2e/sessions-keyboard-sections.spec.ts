/**
 * E2E tests for the Sessions page keyboard shortcuts added on top of the
 * existing arrow navigation:
 *  - ArrowRight / ArrowLeft expand / collapse the focused card's preview.
 *  - PageDown / PageUp jump between session sections
 *    (pinned -> active -> archived), crossing the active/archived sub-tab
 *    boundary when needed.
 */
import { test, expect } from './fixtures';
import { goToSessionsSection } from './helpers/navigation';
import { seedSessions, clearSessions, createTestSession } from './helpers/seed';
import { SessionsListPage } from '../../e2e-shared/pages/index.js';

test.beforeEach(async ({ extensionContext }) => {
  await clearSessions(extensionContext);
});

test.describe('[KBD-SECTIONS] Sessions section + preview shortcuts', () => {
  test('ArrowRight expands and ArrowLeft collapses the focused card preview', async ({
    extensionContext,
    extensionId,
  }) => {
    const s = createTestSession({ name: 'Solo' });
    await seedSessions(extensionContext, [s]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);
    const sessions = new SessionsListPage(page);

    const toggle = sessions.previewToggle(s.id);
    await sessions.card(s.id).focus();
    await expect(toggle).toHaveAttribute('data-state', 'closed');

    await page.keyboard.press('ArrowRight');
    await expect(toggle).toHaveAttribute('data-state', 'open');

    await page.keyboard.press('ArrowLeft');
    await expect(toggle).toHaveAttribute('data-state', 'closed');

    await page.close();
  });

  test('PageDown / PageUp move between pinned and normal sections', async ({
    extensionContext,
    extensionId,
  }) => {
    const pinned = createTestSession({ name: 'Pinned one', isPinned: true });
    const normal = createTestSession({ name: 'Normal one', isPinned: false });
    await seedSessions(extensionContext, [pinned, normal]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);
    const sessions = new SessionsListPage(page);

    await sessions.card(pinned.id).focus();
    await expect(sessions.card(pinned.id)).toBeFocused();

    await page.keyboard.press('PageDown');
    await expect(sessions.card(normal.id)).toBeFocused();

    await page.keyboard.press('PageUp');
    await expect(sessions.card(pinned.id)).toBeFocused();

    await page.close();
  });

  test('PageDown from a normal session crosses into the archived sub-tab', async ({
    extensionContext,
    extensionId,
  }) => {
    const normal = createTestSession({ name: 'Normal one', isPinned: false });
    const archived = createTestSession({ name: 'Archived one', isArchived: true });
    await seedSessions(extensionContext, [normal, archived]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);
    const sessions = new SessionsListPage(page);

    await sessions.card(normal.id).focus();
    await expect(sessions.card(normal.id)).toBeFocused();

    // Jump forward: switch to the archived tab and land on the first archived card.
    await page.keyboard.press('PageDown');
    await expect(sessions.archivedList()).toBeVisible();
    await expect(sessions.card(archived.id)).toBeFocused();

    // Jump back: return to the active tab and focus the first normal card.
    await page.keyboard.press('PageUp');
    await expect(sessions.card(normal.id)).toBeFocused();

    await page.close();
  });
});
