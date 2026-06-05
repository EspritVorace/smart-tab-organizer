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

/** Returns the data-session-id of the currently focused element (or null). */
async function focusedSessionId(page: import('@playwright/test').Page): Promise<string | null> {
  return page.evaluate(() => document.activeElement?.getAttribute('data-session-id') ?? null);
}

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

    const card = page.locator(`[data-session-id="${s.id}"]`);
    const toggle = page.getByTestId(`session-card-${s.id}-preview-toggle`);

    await card.focus();
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

    await page.locator(`[data-session-id="${pinned.id}"]`).focus();
    expect(await focusedSessionId(page)).toBe(pinned.id);

    await page.keyboard.press('PageDown');
    await page.waitForFunction(
      (id) => document.activeElement?.getAttribute('data-session-id') === id,
      normal.id,
      { timeout: 5000 },
    );

    await page.keyboard.press('PageUp');
    await page.waitForFunction(
      (id) => document.activeElement?.getAttribute('data-session-id') === id,
      pinned.id,
      { timeout: 5000 },
    );

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

    await page.locator(`[data-session-id="${normal.id}"]`).focus();
    expect(await focusedSessionId(page)).toBe(normal.id);

    // Jump forward: switch to the archived tab and land on the first archived card.
    await page.keyboard.press('PageDown');
    await page.waitForFunction(
      (id) => document.activeElement?.getAttribute('data-session-id') === id,
      archived.id,
      { timeout: 5000 },
    );
    // The archived sub-tab is now the one rendered.
    await expect(page.getByTestId('page-sessions-archived-list')).toBeVisible();

    // Jump back: return to the active tab and focus the first normal card.
    await page.keyboard.press('PageUp');
    await page.waitForFunction(
      (id) => document.activeElement?.getAttribute('data-session-id') === id,
      normal.id,
      { timeout: 5000 },
    );

    await page.close();
  });
});
