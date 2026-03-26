/**
 * Sessions / Profiles page screenshots (4 screens × 3 locales × 2 themes = 24 PNGs)
 */
import type { Page } from '@playwright/test';
import { test } from '../helpers/screenshot-fixture.js';
import { captureAll, getServiceWorker } from '../helpers/screenshot-helper.js';
import {
  seedSessions,
  clearSessions,
  clearHelpPrefs,
  ALL_SESSIONS,
  SESSION_MORNING_DEV,
  SESSION_RESEARCH,
  SESSION_FOR_CONFLICT,
} from '../fixtures/sessions-seed.js';

// ─── Helper: wait for sessions section to be ready ───────────────────────────

async function waitForSessionsReady(page: Page): Promise<void> {
  await page.waitForFunction(
    () => {
      const body = document.body?.textContent ?? '';
      return !body.includes('Chargement') && body.length > 100;
    },
    { timeout: 10_000 },
  );
  await page.waitForTimeout(500);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('Sessions screenshots', () => {
  test.beforeEach(async ({ extensionContext }) => {
    await clearSessions(extensionContext);
    await clearHelpPrefs(extensionContext);
  });

  /**
   * sessions-list
   * Full sessions page with snapshots + pinned profiles.
   */
  test('sessions-list', async ({ extensionContext, extensionId }, testInfo) => {
    const locale = testInfo.project.name;
    await seedSessions(extensionContext, ALL_SESSIONS);

    await captureAll(
      extensionContext,
      extensionId,
      locale,
      'sessions',
      'sessions-list',
    );
  });

  /**
   * sessions-create-snapshot
   * Snapshot wizard open, category picker visible.
   */
  test('sessions-create-snapshot', async ({ extensionContext, extensionId }, testInfo) => {
    const locale = testInfo.project.name;
    await seedSessions(extensionContext, ALL_SESSIONS);

    await captureAll(
      extensionContext,
      extensionId,
      locale,
      'sessions',
      'sessions-create-snapshot',
      async (page) => {
        await waitForSessionsReady(page);

        // Open snapshot wizard via deep link action parameter
        await page.goto(
          `chrome-extension://${extensionId}/options.html#sessions?action=snapshot`,
        );
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(600);

        // Wait for the wizard dialog
        const dialog = page.locator('[role="dialog"]');
        await dialog.waitFor({ state: 'visible', timeout: 8_000 }).catch(() => {
          // Fallback: try clicking a "Take Snapshot" button if deep link didn't open the wizard
        });
        await page.waitForTimeout(400);
      },
    );
  });

  /**
   * sessions-profile-pin-onboarding
   * Only snapshots seeded (no profiles). Click the pin button on a snapshot
   * card → the first-profile onboarding dialog ("Your First Profile!") appears.
   */
  test('sessions-profile-pin-onboarding', async ({ extensionContext, extensionId }, testInfo) => {
    const locale = testInfo.project.name;
    // Seed snapshots only (no isPinned sessions)
    await seedSessions(extensionContext, [SESSION_MORNING_DEV, SESSION_RESEARCH]);
    // helpPrefs cleared in beforeEach → profileOnboardingShown: false

    await captureAll(
      extensionContext,
      extensionId,
      locale,
      'sessions',
      'sessions-profile-pin-onboarding',
      async (page) => {
        await waitForSessionsReady(page);

        // The pin button (IconButton with Pin icon) is the first icon button
        // in the first session card.
        const pinBtn = page
          .locator('.rt-Card')
          .first()
          .locator('button.rt-IconButton')
          .first();
        await pinBtn.click();
        await page.waitForTimeout(600);

        // Wait for the onboarding dialog to appear
        await page.locator('[role="dialog"]').waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});
        await page.waitForTimeout(400);
      },
    );
  });

  /**
   * sessions-restore-conflict
   * A session with group "Work" (blue) is seeded.  We also create a live tab
   * group "Work" (blue) in the browser window so that analyzeConflicts() detects
   * a conflict.  Then we open the Restore wizard and click Restore → the wizard
   * moves to the ConflictResolutionStep.
   */
  test('sessions-restore-conflict', async ({ extensionContext, extensionId }, testInfo) => {
    const locale = testInfo.project.name;
    await seedSessions(extensionContext, [SESSION_FOR_CONFLICT, SESSION_MORNING_DEV]);

    await captureAll(
      extensionContext,
      extensionId,
      locale,
      'sessions',
      'sessions-restore-conflict',
      async (page) => {
        await waitForSessionsReady(page);

        // ── Create a live tab group "Work" (blue) in the same window ──
        // analyzeConflicts() checks the current window, which is the one
        // showing the options page.
        const sw = await getServiceWorker(extensionContext);

        // Obtain the window ID that contains the options page
        const windowId: number = await page.evaluate(() =>
          new Promise<number>((resolve) => {
            chrome.windows.getCurrent((w) => resolve(w.id!));
          }),
        );

        await sw.evaluate(
          async ({ wid }: { wid: number }) => {
            const tab = await chrome.tabs.create({
              url: 'about:blank',
              windowId: wid,
              active: false,
            });
            const groupId = await chrome.tabs.group({ tabIds: [tab.id!] });
            await chrome.tabGroups.update(groupId, { title: 'Work', color: 'blue' });
          },
          { wid: windowId },
        );
        await page.waitForTimeout(300);

        // ── Open the Restore wizard via the primary "Restore" button ──
        // SessionCard layout (buttons in order): Pin (IconButton) · Restore (rt-Button)
        // · Chevron (rt-Button) · MoreHorizontal (IconButton) · Collapsible toggle.
        // The primary Restore button is the first .rt-Button in the card; clicking it
        // calls onRestore(session) which opens the RestoreWizard (same as "Customize…").
        const firstCard = page.locator('.rt-Card').first();
        const primaryRestoreBtn = firstCard.locator('button.rt-Button').first();
        await primaryRestoreBtn.click();
        await page.waitForTimeout(400);

        // Wait for RestoreWizard dialog
        const dialog = page.locator('[role="dialog"]');
        await dialog.waitFor({ state: 'visible', timeout: 5_000 });
        await page.waitForTimeout(400);

        // Click the "Restore" button in step 0 footer (Cancel · Restore).
        // This calls handleRestoreOrNext() → analyzeConflicts() → conflict found
        // (the live "Work" blue group we created above) → wizard moves to step 1.
        await dialog.getByRole('button').last().click();
        await page.waitForTimeout(1_200);
      },
    );
  });
});
