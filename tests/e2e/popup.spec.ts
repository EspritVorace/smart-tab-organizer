/**
 * E2E tests for the extension popup.
 * Covers: toolbar buttons, pinned sessions list, deep linking.
 */
import { test, expect } from './fixtures';
import { goToPopup, goToSessionsSection } from './helpers/navigation';
import {
  seedSessions,
  clearSessions,
  clearHelpPrefs,
  createTestSession,
  createPinnedSession,
} from './helpers/seed';

test.beforeEach(async ({ extensionContext }) => {
  await clearSessions(extensionContext);
  await clearHelpPrefs(extensionContext);
});

// ---------------------------------------------------------------------------
// Toolbar
// ---------------------------------------------------------------------------
test.describe('[US-PO01] Toolbar', () => {
  test('Options button navigates to the options page', async ({ extensionContext, extensionId }) => {
    const page = await extensionContext.newPage();
    await goToPopup(page, extensionId);

    const [newPage] = await Promise.all([
      extensionContext.waitForEvent('page'),
      page.getByTestId('popup-header-btn-settings').click(),
    ]);
    await newPage.waitForLoadState('domcontentloaded');
    expect(newPage.url()).toContain('options.html');

    await page.close();
    await newPage.close();
  });

  test('Save button navigates to Sessions with snapshot wizard [US-PO004]', async ({
    extensionContext,
    extensionId,
  }) => {
    // Save button is disabled when no capturable tab exists; open a real tab first
    // (hasCapturableTabs() filters out chrome-extension:// and about: URLs)
    const realTab = await extensionContext.newPage();
    await realTab.goto('data:text/html,<p>capturable tab</p>');

    const page = await extensionContext.newPage();
    await goToPopup(page, extensionId);

    await expect(page.getByTestId('popup-toolbar-btn-save')).toBeEnabled({ timeout: 5000 });

    const [newPage] = await Promise.all([
      extensionContext.waitForEvent('page'),
      page.getByTestId('popup-toolbar-btn-save').click(),
    ]);
    await newPage.waitForLoadState('domcontentloaded');
    expect(newPage.url()).toContain('options.html');
    expect(newPage.url()).toContain('sessions');

    await page.close();
    await newPage.close();
  });

  test('Restore button navigates to Sessions section [US-PO001]', async ({ extensionContext, extensionId }) => {
    // Restore button is disabled when no sessions exist — seed one to enable it
    const session = createTestSession({ name: 'Restorable' });
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToPopup(page, extensionId);

    // Wait for sessions to load so the Restore button is enabled
    await expect(page.getByTestId('popup-toolbar-btn-restore')).toBeEnabled({ timeout: 5000 });

    const [newPage] = await Promise.all([
      extensionContext.waitForEvent('page'),
      page.getByTestId('popup-toolbar-btn-restore').click(),
    ]);
    await newPage.waitForLoadState('domcontentloaded');
    expect(newPage.url()).toContain('options.html');

    await newPage.close();
  });
});

// ---------------------------------------------------------------------------
// Pinned sessions list
// ---------------------------------------------------------------------------
test.describe('[US-PO02] Pinned sessions list', () => {
  test('pinned sessions section is hidden when no pinned sessions exist', async ({ extensionContext, extensionId }) => {
    // Only snapshots, no pinned sessions
    const snapshot = createTestSession({ name: 'Just A Snapshot' });
    await seedSessions(extensionContext, [snapshot]);

    const page = await extensionContext.newPage();
    await goToPopup(page, extensionId);

    await expect(page.getByText('Pinned sessions')).toBeHidden();
    await page.close();
  });

  test('pinned sessions section shows when pinned sessions exist [US-PO005]', async ({ extensionContext, extensionId }) => {
    const pinned = createPinnedSession({ name: 'My Pinned Session' });
    await seedSessions(extensionContext, [pinned]);

    const page = await extensionContext.newPage();
    await goToPopup(page, extensionId);

    await expect(page.getByText('Pinned sessions')).toBeVisible();
    await expect(page.getByText('My Pinned Session')).toBeVisible();
    await page.close();
  });

  test('popup shows all pinned sessions [US-PO005]', async ({ extensionContext, extensionId }) => {
    const sessions = [
      createPinnedSession({ name: 'Work Session' }),
      createPinnedSession({ name: 'Personal Session' }),
    ];
    await seedSessions(extensionContext, sessions);

    const page = await extensionContext.newPage();
    await goToPopup(page, extensionId);

    await expect(page.getByText('Work Session')).toBeVisible();
    await expect(page.getByText('Personal Session')).toBeVisible();
    await page.close();
  });

  test('unpinned sessions are not shown in popup pinned list [US-PO005]', async ({
    extensionContext,
    extensionId,
  }) => {
    const snapshot = createTestSession({ name: 'Hidden Snapshot' });
    const pinned = createPinnedSession({ name: 'Visible Pinned' });
    await seedSessions(extensionContext, [snapshot, pinned]);

    const page = await extensionContext.newPage();
    await goToPopup(page, extensionId);

    await expect(page.getByText('Visible Pinned')).toBeVisible();
    await expect(page.getByText('Hidden Snapshot')).toBeHidden();
    await page.close();
  });

  test('each pinned session row has a restore button [US-PO002]', async ({ extensionContext, extensionId }) => {
    const pinned = createPinnedSession({ name: 'Restorable Pinned' });
    await seedSessions(extensionContext, [pinned]);

    const page = await extensionContext.newPage();
    await goToPopup(page, extensionId);

    await expect(page.getByRole('button', { name: 'Restore options' })).toBeVisible();
    await page.close();
  });

  test('pinned session row dropdown offers current window and new window options', async ({
    extensionContext,
    extensionId,
  }) => {
    const pinned = createPinnedSession({ name: 'Dropdown Pinned' });
    await seedSessions(extensionContext, [pinned]);

    const page = await extensionContext.newPage();
    await goToPopup(page, extensionId);

    await page.getByRole('button', { name: 'Restore options' }).click();

    await expect(page.getByRole('menuitem', { name: /current window/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /new window/i })).toBeVisible();
    await page.close();
  });
});

// ---------------------------------------------------------------------------
// Deep linking (options page side)
// ---------------------------------------------------------------------------
test.describe('[US-PO01] Deep linking', () => {
  test('#sessions hash shows the Sessions section', async ({ extensionContext, extensionId }) => {
    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await expect(
      page.getByText(/sessions/i).first(),
    ).toBeVisible();
    await page.close();
  });

  test('#sessions?action=snapshot hash auto-opens the snapshot wizard [US-PO004]', async ({
    extensionContext,
    extensionId,
  }) => {
    const page = await extensionContext.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html#sessions?action=snapshot`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    await expect(page.getByTestId('wizard-snapshot')).toBeVisible();
    await expect(page.getByText('Save Session Snapshot')).toBeVisible();
    await page.close();
  });
});
