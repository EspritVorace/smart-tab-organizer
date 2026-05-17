/**
 * E2E tests for keyboard-driven drag-and-drop reordering of sessions.
 * Validates that the dnd-kit KeyboardSensor (default Space/Enter to grab,
 * arrows to move, Escape to cancel) is reachable via Tab now that the
 * drag handle is rendered as a focusable IconButton.
 */
import { test, expect } from './fixtures';
import { goToSessionsSection } from './helpers/navigation';
import {
  seedSessions,
  clearSessions,
  getSessionsFromStorage,
  createTestSession,
} from './helpers/seed';

test.beforeEach(async ({ extensionContext }) => {
  await clearSessions(extensionContext);
});

test.describe('[KBD-DND] Sessions keyboard drag-and-drop', () => {
  test('drag handle is focusable and exposes keyboard shortcuts', async ({
    extensionContext,
    extensionId,
  }) => {
    await seedSessions(extensionContext, [createTestSession({ name: 'Solo' })]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    // allow-inline-dom: drag-handle is a DnD atom selector, not a dialog/wizard surface.
    const handle = page.locator('[data-testid$="-drag-handle"]').first();
    await expect(handle).toBeVisible();

    const tagName = await handle.evaluate((el) => el.tagName.toLowerCase());
    expect(tagName).toBe('button');

    await expect(handle).toHaveAttribute('aria-keyshortcuts', /Space.*Enter.*Arrow/);

    await handle.focus();
    await expect(handle).toBeFocused();

    await page.close();
  });

  test('keyboard reorders sessions via Space + ArrowDown + Space', async ({
    extensionContext,
    extensionId,
  }) => {
    const sA = createTestSession({ name: 'Session A' });
    const sB = createTestSession({ name: 'Session B' });
    const sC = createTestSession({ name: 'Session C' });
    await seedSessions(extensionContext, [sA, sB, sC]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    const handleA = page
      .locator(`[data-testid="session-card-${sA.id}-drag-handle"]`);

    await handleA.focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Space');

    await page.waitForFunction((targetId) => {
      const cards = [...document.querySelectorAll('[data-testid^="session-card-"]')]
        .filter((el) => /^session-card-[^-]+(-[^-]+){4}$/.test(el.getAttribute('data-testid') ?? ''));
      const ids = cards.map((c) => c.getAttribute('data-testid'));
      const targetIdx = ids.indexOf(`session-card-${targetId}`);
      return targetIdx > 0;
    }, sA.id, { timeout: 5000 });

    await page.close();

    const stored = await getSessionsFromStorage(extensionContext);
    const idxA = stored.findIndex((s) => s.id === sA.id);
    const idxB = stored.findIndex((s) => s.id === sB.id);
    expect(idxA).toBeGreaterThan(idxB);
  });

  test('Escape during keyboard drag cancels the reorder', async ({
    extensionContext,
    extensionId,
  }) => {
    const sA = createTestSession({ name: 'Session A' });
    const sB = createTestSession({ name: 'Session B' });
    const sC = createTestSession({ name: 'Session C' });
    await seedSessions(extensionContext, [sA, sB, sC]);

    const before = (await getSessionsFromStorage(extensionContext)).map((s) => s.id);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    const handleA = page
      .locator(`[data-testid="session-card-${sA.id}-drag-handle"]`)
      .first();

    await handleA.focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Escape');

    // Wait until dnd-kit unmounts the drag overlay clone and clears aria-pressed.
    await page.waitForFunction((id) => {
      const handles = document.querySelectorAll(
        `[data-testid="session-card-${id}-drag-handle"]`,
      );
      const pressed = Array.from(handles).some(
        (h) => h.getAttribute('aria-pressed') === 'true',
      );
      return !pressed;
    }, sA.id, { timeout: 5000 });

    await page.close();

    const after = (await getSessionsFromStorage(extensionContext)).map((s) => s.id);
    expect(after).toEqual(before);
  });
});
