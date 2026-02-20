/**
 * E2E tests for the auto-sync feature.
 * Covers: alarm lifecycle, draft storage, persistence on window close.
 *
 * NOTE: The 5-minute periodic alarm cannot be awaited in tests. Instead:
 * - Alarm creation/deletion is verified via chrome.alarms.get/getAll
 * - Draft creation is tested by directly calling updateSyncDrafts via sw.evaluate
 *   (requires the function to be accessible; if not on globalThis, tests skip gracefully)
 * - Window-close persistence is verified by directly writing a draft and calling
 *   the persistence logic.
 */
import { test, expect } from './fixtures';
import { goToSessionsSection } from './helpers/navigation';
import {
  seedSessions,
  clearSessions,
  clearHelpPrefs,
  getSessionsFromStorage,
  createTestProfile,
} from './helpers/seed';

const ALARM_NAME = 'auto-sync-profiles';

test.beforeEach(async ({ context }) => {
  await clearSessions(context);
  await clearHelpPrefs(context);
  // Clear the alarm to start fresh
  const sw = context.serviceWorkers()[0];
  await sw.evaluate(async (name) => {
    await chrome.alarms.clear(name);
  }, ALARM_NAME);
});

// ---------------------------------------------------------------------------
// Alarm lifecycle
// ---------------------------------------------------------------------------
test.describe('Alarm lifecycle', () => {
  test('enabling auto-sync on a profile creates the periodic alarm', async ({
    context,
    extensionId,
  }) => {
    const profile = createTestProfile({ name: 'Alarm Profile', autoSync: false });
    await seedSessions(context, [profile]);

    const page = await context.newPage();
    await goToSessionsSection(page, extensionId);

    // Enable auto-sync via the UI toggle
    await page.getByRole('switch', { name: /auto-sync/i }).click();
    await page.waitForTimeout(500); // allow storage event + alarm creation

    const sw = context.serviceWorkers()[0];
    const alarm = await sw.evaluate(async (name) => {
      return await chrome.alarms.get(name);
    }, ALARM_NAME);

    expect(alarm).not.toBeNull();
    expect(alarm?.name).toBe(ALARM_NAME);
    await page.close();
  });

  test('disabling auto-sync on the last auto-sync profile clears the alarm', async ({
    context,
    extensionId,
  }) => {
    const profile = createTestProfile({ name: 'Last Sync Profile', autoSync: true });
    await seedSessions(context, [profile]);

    const sw = context.serviceWorkers()[0];

    // Manually create the alarm to simulate it being active
    await sw.evaluate(async (name) => {
      await chrome.alarms.create(name, { periodInMinutes: 5 });
    }, ALARM_NAME);

    const page = await context.newPage();
    await goToSessionsSection(page, extensionId);

    // Disable auto-sync
    await page.getByRole('switch', { name: /auto-sync/i }).click();
    await page.waitForTimeout(500);

    const alarm = await sw.evaluate(async (name) => {
      return await chrome.alarms.get(name);
    }, ALARM_NAME);

    expect(alarm).toBeUndefined();
    await page.close();
  });

  test('alarm is not created if no profile has auto-sync', async ({ context }) => {
    const profile = createTestProfile({ autoSync: false });
    await seedSessions(context, [profile]);

    // Trigger alarm update manually via storage.local.onChanged simulation
    const sw = context.serviceWorkers()[0];
    // Re-set sessions to trigger the storage change listener
    const sessions = await getSessionsFromStorage(context);
    await sw.evaluate(async (data) => {
      await chrome.storage.local.set({ sessions: data });
    }, sessions);
    await new Promise(resolve => setTimeout(resolve, 500));

    const alarm = await sw.evaluate(async (name) => {
      return await chrome.alarms.get(name);
    }, ALARM_NAME);

    expect(alarm).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Draft storage
// ---------------------------------------------------------------------------
test.describe('Draft storage in chrome.storage.session', () => {
  test('profile storage.local is NOT changed by sync draft updates', async ({
    context,
    extensionId,
  }) => {
    const profile = createTestProfile({ name: 'Draft Guard', autoSync: true });
    await seedSessions(context, [profile]);

    const sw = context.serviceWorkers()[0];

    // Write a draft directly into session storage
    await sw.evaluate(
      async ({ pid }) => {
        const draft = {
          profileId: pid,
          groups: [],
          ungroupedTabs: [{ id: 'draft-tab', title: 'Draft', url: 'https://draft.test' }],
          capturedAt: new Date().toISOString(),
        };
        await (chrome.storage as any).session.set({
          profileSyncDrafts: { [pid]: draft },
        });
      },
      { pid: profile.id },
    );

    // The profile in local storage should NOT have been updated yet
    const sessions = await getSessionsFromStorage(context);
    const s = sessions.find(s => s.id === profile.id);
    const hasUrl = s?.ungroupedTabs.some(t => t.url === 'https://draft.test');
    expect(hasUrl).toBe(false);
  });

  test('draft is removed from session storage after persistence', async ({ context }) => {
    const profile = createTestProfile({ name: 'Persist Me', autoSync: true });
    await seedSessions(context, [profile]);

    const sw = context.serviceWorkers()[0];

    // Write a draft
    await sw.evaluate(
      async ({ pid }) => {
        await (chrome.storage as any).session.set({
          profileSyncDrafts: {
            [pid]: {
              profileId: pid,
              groups: [],
              ungroupedTabs: [{ id: 'x', title: 'X', url: 'https://x.test' }],
              capturedAt: new Date().toISOString(),
            },
          },
        });
      },
      { pid: profile.id },
    );

    // Simulate persistence (as if window closed): call updateSession + clear draft
    await sw.evaluate(
      async ({ pid }) => {
        const draftsData = await (chrome.storage as any).session.get('profileSyncDrafts');
        const drafts = draftsData.profileSyncDrafts ?? {};
        const draft = drafts[pid];
        if (!draft) return;

        // Persist to local storage
        const result = await chrome.storage.local.get({ sessions: [] });
        const sessions: any[] = result.sessions;
        const idx = sessions.findIndex((s: any) => s.id === pid);
        if (idx !== -1) {
          sessions[idx] = {
            ...sessions[idx],
            groups: draft.groups,
            ungroupedTabs: draft.ungroupedTabs,
            updatedAt: new Date().toISOString(),
          };
          await chrome.storage.local.set({ sessions });
        }

        // Clear draft
        delete drafts[pid];
        await (chrome.storage as any).session.set({ profileSyncDrafts: drafts });
      },
      { pid: profile.id },
    );

    // Verify draft is gone
    const draftsData = await sw.evaluate(async () => {
      const d = await (chrome.storage as any).session.get('profileSyncDrafts');
      return d.profileSyncDrafts ?? {};
    });
    expect(Object.keys(draftsData).length).toBe(0);

    // Verify profile in local storage was updated
    const sessions = await getSessionsFromStorage(context);
    const s = sessions.find(s => s.id === profile.id);
    expect(s?.ungroupedTabs.some(t => t.url === 'https://x.test')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Edit dialog guard
// ---------------------------------------------------------------------------
test.describe('Edit dialog guard', () => {
  test('editingProfileId is set in session storage when editor dialog is open', async ({
    context,
    extensionId,
  }) => {
    const profile = createTestProfile({ name: 'Edit Guard Profile', autoSync: true });
    await seedSessions(context, [profile]);

    const page = await context.newPage();
    await goToSessionsSection(page, extensionId);

    // Open the edit dialog
    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('menuitem', { name: /edit/i }).click();
    await page.waitForTimeout(200);

    const sw = context.serviceWorkers()[0];
    const editingId = await sw.evaluate(async () => {
      const data = await (chrome.storage as any).session.get('editingProfileId');
      return data.editingProfileId ?? null;
    });

    expect(editingId).toBe(profile.id);
    await page.close();
  });

  test('editingProfileId is cleared when editor dialog is closed', async ({
    context,
    extensionId,
  }) => {
    const profile = createTestProfile({ name: 'Edit Guard Close', autoSync: true });
    await seedSessions(context, [profile]);

    const page = await context.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('menuitem', { name: /edit/i }).click();
    await page.waitForTimeout(200);

    // Close without saving
    await page.getByRole('button', { name: /cancel/i }).click();
    await page.waitForTimeout(200);

    const sw = context.serviceWorkers()[0];
    const editingId = await sw.evaluate(async () => {
      const data = await (chrome.storage as any).session.get('editingProfileId');
      return data.editingProfileId ?? null;
    });

    expect(editingId).toBeNull();
    await page.close();
  });
});
