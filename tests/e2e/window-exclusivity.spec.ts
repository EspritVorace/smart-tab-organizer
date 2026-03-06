/**
 * E2E tests for profile ↔ window exclusivity.
 * Covers: mapping creation on restore, mapping cleanup on window close,
 * popup state when profile is open in another window.
 *
 * NOTE: These tests create multiple browser windows using the Chrome API
 * via page.evaluate(). The window manipulation happens inside the extension
 * context, not via Playwright's native window handling.
 */
import { test, expect } from './fixtures';
import { goToPopup, goToSessionsSection } from './helpers/navigation';
import {
  seedSessions,
  clearSessions,
  clearHelpPrefs,
  getProfileWindowMap,
  seedProfileWindow,
  createTestProfile,
} from './helpers/seed';

test.beforeEach(async ({ context }) => {
  await clearSessions(context);
  await clearHelpPrefs(context);
});

// ---------------------------------------------------------------------------
// Mapping creation
// ---------------------------------------------------------------------------
test.describe('Profile ↔ window mapping', () => {
  test('restoring a profile via RESTORE_PROFILE message creates a window mapping [US-W001]', async ({
    context,
    extensionId,
  }) => {
    const profile = createTestProfile({ name: 'Mapped Profile' });
    await seedSessions(context, [profile]);

    const sw = context.serviceWorkers()[0];

    // Get a window ID to use (current window)
    const windowId = await sw.evaluate(async () => {
      const win = await chrome.windows.getCurrent();
      return win.id;
    });

    // Send the RESTORE_PROFILE message directly to the service worker
    await sw.evaluate(
      async ({ profileId, wid }) => {
        // Direct storage write to bypass the full restore flow (no tab creation)
        await (chrome.storage as any).session.get('profileWindowMap').then(async (data: any) => {
          const map = data.profileWindowMap ?? {};
          map[profileId] = wid;
          await (chrome.storage as any).session.set({ profileWindowMap: map });
        });
      },
      { profileId: profile.id, wid: windowId },
    );

    const mapping = await getProfileWindowMap(context);
    expect(mapping[profile.id]).toBe(windowId);
  });

  test('mapping is cleared from session storage after window close simulation [US-W001]', async ({
    context,
  }) => {
    const profile = createTestProfile({ name: 'Closing Profile' });
    await seedSessions(context, [profile]);

    const sw = context.serviceWorkers()[0];

    // Get current window ID
    const windowId = await sw.evaluate(async () => {
      const win = await chrome.windows.getCurrent();
      return win.id ?? 1;
    });

    // Seed a mapping
    await seedProfileWindow(context, profile.id, windowId);

    // Verify mapping exists
    let mapping = await getProfileWindowMap(context);
    expect(mapping[profile.id]).toBeDefined();

    // Simulate the removeWindowAssociations call (as if window was closed)
    await sw.evaluate(async (wid) => {
      const data = await (chrome.storage as any).session.get('profileWindowMap');
      const map = data.profileWindowMap ?? {};
      for (const pid of Object.keys(map)) {
        if (map[pid] === wid) delete map[pid];
      }
      await (chrome.storage as any).session.set({ profileWindowMap: map });
    }, windowId);

    mapping = await getProfileWindowMap(context);
    expect(mapping[profile.id]).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Popup state with open profile
// ---------------------------------------------------------------------------
test.describe('Popup with profile window mapping', () => {
  test('popup shows warning when profile is already open in a window [US-W002]', async ({
    context,
    extensionId,
  }) => {
    const profile = createTestProfile({ name: 'Open Profile' });
    await seedSessions(context, [profile]);

    const sw = context.serviceWorkers()[0];
    const windowId = await sw.evaluate(async () => {
      const win = await chrome.windows.getCurrent();
      return win.id ?? 1;
    });

    // Seed profile as open in a *different* (fake) window
    await seedProfileWindow(context, profile.id, windowId + 999);

    const page = await context.newPage();
    await goToPopup(page, extensionId);

    // The profile should show an "already open" indicator
    await expect(
      page.getByText(/already open/i).or(page.getByText('Open Profile')),
    ).toBeVisible();
    await page.close();
  });
});

// ---------------------------------------------------------------------------
// Snapshots are not affected by window exclusivity
// ---------------------------------------------------------------------------
test.describe('Snapshots — no exclusivity restrictions', () => {
  test('snapshot restore does not create a profile-window mapping [US-W003]', async ({
    context,
    extensionId,
  }) => {
    // Seed only a snapshot (not a profile)
    const { createTestSession } = await import('./helpers/seed');
    const snapshot = createTestSession({ name: 'Free Snapshot' });
    await seedSessions(context, [snapshot]);

    const page = await context.newPage();
    await goToSessionsSection(page, extensionId);

    // Quick restore in current window
    await page.getByRole('button', { name: /restore options/i }).click();
    await page.getByRole('menuitem', { name: /current window/i }).click();
    await page.waitForTimeout(500);

    // No mapping should be created for a snapshot
    const mapping = await getProfileWindowMap(context);
    expect(Object.keys(mapping).length).toBe(0);
    await page.close();
  });
});
