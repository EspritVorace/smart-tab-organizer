/**
 * E2E tests for popup pinned sessions order.
 * Verifies that pinned sessions in the popup respect the storage order
 * (which can be manually reordered via drag-drop in SessionsPage).
 */
import { test, expect } from './fixtures';
import { goToPopup, goToSessionsSection } from './helpers/navigation';
import {
  seedSessions,
  clearSessions,
  createPinnedSession,
} from './helpers/seed';

test.beforeEach(async ({ extensionContext }) => {
  await clearSessions(extensionContext);
});

test.describe('[US-PIN-ORDER] Popup pinned sessions order', () => {
  test('popup displays pinned sessions in storage order (not by updatedAt)', async ({
    extensionContext,
    extensionId,
  }) => {
    // Create 3 pinned sessions with timestamps in reverse order
    // to verify they're NOT sorted by updatedAt
    const now = new Date();
    const p1 = createPinnedSession({
      name: 'Pinned A (oldest)',
      updatedAt: new Date(now.getTime() - 10000).toISOString(),
    });
    const p2 = createPinnedSession({
      name: 'Pinned B (newest)',
      updatedAt: new Date(now.getTime()).toISOString(),
    });
    const p3 = createPinnedSession({
      name: 'Pinned C (middle)',
      updatedAt: new Date(now.getTime() - 5000).toISOString(),
    });

    // Seed in storage order: p1, p2, p3
    await seedSessions(extensionContext, [p1, p2, p3]);

    const page = await extensionContext.newPage();
    await goToPopup(page, extensionId);

    // Get pinned sessions by their text in the popup
    // Order should be storage order (p1, p2, p3), NOT sorted by updatedAt (p2, p3, p1)
    const pinnedA = page.getByText('Pinned A (oldest)');
    const pinnedB = page.getByText('Pinned B (newest)');
    const pinnedC = page.getByText('Pinned C (middle)');

    // All should be visible
    await expect(pinnedA).toBeVisible();
    await expect(pinnedB).toBeVisible();
    await expect(pinnedC).toBeVisible();

    // Get bounding boxes to determine visual order (top to bottom)
    const boxA = await pinnedA.boundingBox();
    const boxB = await pinnedB.boundingBox();
    const boxC = await pinnedC.boundingBox();

    if (boxA && boxB && boxC) {
      // Verify order by Y position (top = earlier, bottom = later)
      expect(boxA.y).toBeLessThan(boxB.y); // A before B
      expect(boxB.y).toBeLessThan(boxC.y); // B before C
    }

    await page.close();
  });

  test('popup respects custom storage order from multiple pinned sessions', async ({
    extensionContext,
    extensionId,
  }) => {
    // Create 3 pinned sessions and seed them in a custom order
    const p1 = createPinnedSession({ name: 'Middle Session' });
    const p2 = createPinnedSession({ name: 'Last Session' });
    const p3 = createPinnedSession({ name: 'First Session' });

    // Seed in custom order: Middle, Last, First (not sorted alphabetically or by date)
    await seedSessions(extensionContext, [p1, p2, p3]);

    const page = await extensionContext.newPage();
    await goToPopup(page, extensionId);

    // Get pinned sessions by their text
    const middle = page.getByText('Middle Session', { exact: true });
    const last = page.getByText('Last Session', { exact: true });
    const first = page.getByText('First Session', { exact: true });

    // All should be visible
    await expect(middle).toBeVisible();
    await expect(last).toBeVisible();
    await expect(first).toBeVisible();

    // Verify order by bounding box (visual top-to-bottom order)
    const boxMiddle = await middle.boundingBox();
    const boxLast = await last.boundingBox();
    const boxFirst = await first.boundingBox();

    if (boxMiddle && boxLast && boxFirst) {
      // Order should be storage order (Middle, Last, First), not alphabetical
      expect(boxMiddle.y).toBeLessThan(boxLast.y); // Middle before Last
      expect(boxLast.y).toBeLessThan(boxFirst.y); // Last before First
    }

    await page.close();
  });

  test('unpinned sessions should not appear in popup pinned list', async ({
    extensionContext,
    extensionId,
  }) => {
    // Create 2 pinned + 1 unpinned
    const p1 = createPinnedSession({ name: 'Pinned 1' });
    const p2 = createPinnedSession({ name: 'Pinned 2' });
    const u1 = { ...p1, isPinned: false, name: 'Unpinned 1' };

    await seedSessions(extensionContext, [p1, u1, p2]);

    const page = await extensionContext.newPage();
    await goToPopup(page, extensionId);

    // Should show pinned sessions label
    await expect(page.getByText('Pinned sessions')).toBeVisible();

    // Should show pinned sessions
    await expect(page.getByText('Pinned 1', { exact: true })).toBeVisible();
    await expect(page.getByText('Pinned 2', { exact: true })).toBeVisible();

    // Verify unpinned session is NOT in the popup
    await expect(page.getByText('Unpinned 1')).toBeHidden();

    await page.close();
  });
});
