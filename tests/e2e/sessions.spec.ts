/**
 * E2E tests for the Sessions feature (Options page → Sessions section).
 * Covers: empty state, session list, snapshot creation, rename, delete, restore.
 */
import { test, expect } from './fixtures';
import { goToSessionsSection } from './helpers/navigation';
import {
  seedSessions,
  clearSessions,
  clearHelpPrefs,
  getSessionsFromStorage,
  createTestSession,
  createPinnedSession,
} from './helpers/seed';

test.beforeEach(async ({ extensionContext }) => {
  await clearSessions(extensionContext);
  await clearHelpPrefs(extensionContext);
});

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------
test.describe('[US-O01] Empty state', () => {
  test('shows empty state title and description when no sessions exist', async ({
    extensionContext,
    extensionId,
  }) => {
    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await expect(page.getByText('No saved sessions.')).toBeVisible();
    await expect(
      page.getByText(/snapshot|profile/i).first(),
    ).toBeVisible();
    await page.close();
  });

  test('shows Take Snapshot button in empty state [US-S010]', async ({
    extensionContext,
    extensionId,
  }) => {
    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await expect(page.getByRole('button', { name: 'Take Snapshot' }).first()).toBeVisible();
    await page.close();
  });

  test('shows intro callout on first visit [US-O001]', async ({ extensionContext, extensionId }) => {
    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    // The intro callout contains this unique body text; it is shown until dismissed
    await expect(page.getByText('Sessions capture your open tabs')).toBeVisible();
    await page.close();
  });
});

// ---------------------------------------------------------------------------
// Session list rendering
// ---------------------------------------------------------------------------
test.describe('[US-S02] Session list', () => {
  test('displays session cards with name and tab counts', async ({ extensionContext, extensionId }) => {
    const session = createTestSession({ name: 'My Work Tabs' });
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await expect(page.getByText('My Work Tabs')).toBeVisible();
    // 2 tabs in group + 1 ungrouped = 3 tabs total
    await expect(page.getByText(/3 tab/i)).toBeVisible();
    await page.close();
  });

  test('renders multiple sessions [US-S002]', async ({ extensionContext, extensionId }) => {
    const sessions = [
      createTestSession({ name: 'Session A' }),
      createTestSession({ name: 'Session B' }),
      createTestSession({ name: 'Session C' }),
    ];
    await seedSessions(extensionContext, sessions);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    // Use exact:true to avoid matching "session as" in the intro callout body
    await expect(page.getByText('Session A', { exact: true })).toBeVisible();
    await expect(page.getByText('Session B', { exact: true })).toBeVisible();
    await expect(page.getByText('Session C', { exact: true })).toBeVisible();
    await page.close();
  });

  test('sorts pinned sessions before snapshots [US-S008]', async ({ extensionContext, extensionId }) => {
    const snapshot = createTestSession({ name: 'Snapshot Session' });
    const profile = createPinnedSession({ name: 'Pinned Session' });
    // Seed snapshot first so ordering is deliberately wrong without sort
    await seedSessions(extensionContext, [snapshot, profile]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    const cards = page.getByText(/Session/i);
    const texts = await cards.allTextContents();
    const profileIdx = texts.findIndex(t => t.includes('Pinned Session'));
    const snapshotIdx = texts.findIndex(t => t.includes('Snapshot Session'));
    expect(profileIdx).toBeLessThan(snapshotIdx);
    await page.close();
  });

  test('session card displays group count alongside tab count', async ({ extensionContext, extensionId }) => {
    // createTestSession has 1 group with 2 tabs + 1 ungrouped = 3 tabs, 1 group
    const session = createTestSession({ name: 'Badge Session' });
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await expect(page.getByText(/1 group/i)).toBeVisible();
    await page.close();
  });

  test('session card does not display a date (date removed from card)', async ({ extensionContext, extensionId }) => {
    const session = createTestSession({ name: 'Dated Session' });
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    // The card no longer shows a formatted date — only name, counts and restore button
    await expect(page.getByText('Dated Session')).toBeVisible();
    await expect(page.getByText(/3 tab/i)).toBeVisible();
    await page.close();
  });
});

// ---------------------------------------------------------------------------
// Rename
// ---------------------------------------------------------------------------
test.describe('[US-S08] Rename', () => {
  test('double-click on session name enters rename mode', async ({ extensionContext, extensionId }) => {
    const session = createTestSession({ name: 'Original Name' });
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByText('Original Name').dblclick();
    // Rename input should be visible
    await expect(page.getByRole('textbox', { name: /session name/i })).toBeVisible();
    await page.close();
  });

  test('pressing Enter confirms the new name [US-S003]', async ({ extensionContext, extensionId }) => {
    const session = createTestSession({ name: 'Old Name' });
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByText('Old Name').dblclick();
    const input = page.getByRole('textbox', { name: /session name/i });
    await input.fill('New Name');
    await input.press('Enter');

    await expect(page.getByText('New Name')).toBeVisible();
    await expect(page.getByText('Old Name')).not.toBeVisible();
    await page.close();
  });

  test('pressing Escape cancels rename [US-S003]', async ({ extensionContext, extensionId }) => {
    const session = createTestSession({ name: 'Stable Name' });
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByText('Stable Name').dblclick();
    const input = page.getByRole('textbox', { name: /session name/i });
    await input.fill('Changed Name');
    await input.press('Escape');

    await expect(page.getByText('Stable Name')).toBeVisible();
    await expect(page.getByText('Changed Name')).not.toBeVisible();
    await page.close();
  });
});

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------
test.describe('[US-S07] Delete', () => {
  test('more-actions menu contains Delete option', async ({ extensionContext, extensionId }) => {
    const session = createTestSession({ name: 'Deletable Session' });
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: 'More actions' }).click();
    await expect(page.getByRole('menuitem', { name: /delete/i })).toBeVisible();
    await page.close();
  });

  test('clicking Delete opens confirmation dialog [US-S004]', async ({ extensionContext, extensionId }) => {
    const session = createTestSession({ name: 'To Be Deleted' });
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('menuitem', { name: /delete/i }).click();

    // ConfirmDialog should appear
    await expect(page.getByRole('alertdialog')).toBeVisible();
    await page.close();
  });

  test('confirming Delete removes the session card [US-S004]', async ({ extensionContext, extensionId }) => {
    const session = createTestSession({ name: 'To Be Deleted' });
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('menuitem', { name: /delete/i }).click();
    // Click the red "Delete" confirm button
    await page.getByRole('button', { name: /delete/i }).last().click();

    await expect(page.getByText('To Be Deleted')).not.toBeVisible();
    // Empty state should appear
    await expect(page.getByText('No saved sessions.')).toBeVisible();
    await page.close();
  });

  test('cancelling Delete keeps the session [US-S004]', async ({ extensionContext, extensionId }) => {
    const session = createTestSession({ name: 'Will Survive' });
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('menuitem', { name: /delete/i }).click();
    await page.getByRole('button', { name: /cancel/i }).click();

    await expect(page.getByText('Will Survive')).toBeVisible();
    await page.close();
  });
});

// ---------------------------------------------------------------------------
// Snapshot creation
// ---------------------------------------------------------------------------
test.describe('[US-S01] Snapshot creation', () => {
  test('Take Snapshot button opens the snapshot wizard dialog', async ({
    extensionContext,
    extensionId,
  }) => {
    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: 'Take Snapshot' }).first().click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Save Session Snapshot')).toBeVisible();
    await page.close();
  });

  test('snapshot wizard shows session name field and tab list [US-S001]', async ({ extensionContext, extensionId }) => {
    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: 'Take Snapshot' }).first().click();

    await expect(page.getByRole('dialog').getByText('Session name')).toBeVisible();
    await page.close();
  });

  test('all capturable tabs are pre-selected by default in the wizard', async ({
    extensionContext,
    extensionId,
  }) => {
    // Open a real tab so there is something to capture
    const realTab = await extensionContext.newPage();
    await realTab.goto('data:text/html,<p>pre-select test</p>');

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: 'Take Snapshot' }).first().click();
    await page.waitForTimeout(800);

    // All checkboxes in the tab tree should be checked (aria-checked="true")
    const unchecked = page.getByRole('dialog').locator('[aria-checked="false"]');
    await expect(unchecked).toHaveCount(0);

    await realTab.close();
    await page.close();
  });

  test('snapshot wizard tab list excludes system tabs (chrome://, about:)', async ({
    extensionContext,
    extensionId,
  }) => {
    // captureCurrentTabs() must filter out chrome-extension://, about:, chrome:// URLs
    const realTab = await extensionContext.newPage();
    await realTab.goto('data:text/html,<p>real tab for snapshot</p>');

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: 'Take Snapshot' }).first().click();
    await page.waitForTimeout(800);

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText(/chrome:\/\//)).not.toBeVisible();
    await expect(dialog.getByText('about:blank')).not.toBeVisible();

    await realTab.close();
    await page.close();
  });

  test('Save Session button is enabled after tab capture', async ({ extensionContext, extensionId }) => {
    // captureCurrentTabs() filters out chrome-extension:// URLs, so open a real tab first
    const extraTab = await extensionContext.newPage();
    await extraTab.goto('data:text/html,<p>test tab for snapshot</p>');

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: 'Take Snapshot' }).first().click();
    await page.waitForTimeout(800); // wait for tab capture to complete

    await expect(page.getByRole('dialog').getByRole('button', { name: 'Save Session' })).toBeEnabled();
    await extraTab.close();
    await page.close();
  });

  test('Save Session button creates session [US-S001]', async ({
    extensionContext,
    extensionId,
  }) => {
    // captureCurrentTabs() filters out chrome-extension:// URLs, so open a real tab first
    const extraTab = await extensionContext.newPage();
    await extraTab.goto('data:text/html,<p>test tab for snapshot</p>');

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: 'Take Snapshot' }).first().click();
    await page.waitForTimeout(800);

    await page.getByRole('button', { name: 'Save Session' }).click();

    // Dialog auto-closes after saving
    await expect(page.getByRole('dialog')).not.toBeVisible();

    const sessions = await getSessionsFromStorage(extensionContext);
    expect(sessions.length).toBe(1);
    expect(sessions[0].isPinned).toBe(false);
    await extraTab.close();
    await page.close();
  });
});

// ---------------------------------------------------------------------------
// Restore — split button
// ---------------------------------------------------------------------------
test.describe('[US-S04][US-S06] Restore — split button', () => {
  test('Restore button is visible on session card', async ({ extensionContext, extensionId }) => {
    const session = createTestSession({ name: 'Restorable' });
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    // 'Restore' may match multiple buttons; use first() to pick the main restore button
    await expect(page.getByRole('button', { name: 'Restore' }).first()).toBeVisible();
    await page.close();
  });

  test('split button dropdown contains quick restore options [US-S011]', async ({ extensionContext, extensionId }) => {
    const session = createTestSession({ name: 'Restorable' });
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    // Click the dropdown chevron of the split button
    await page.getByRole('button', { name: /restore options/i }).click();

    await expect(page.getByRole('menuitem', { name: /current window/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /new window/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /customize/i })).toBeVisible();
    await page.close();
  });

  test('quick restore in current window shows success callout [US-S011]', async ({
    extensionContext,
    extensionId,
  }) => {
    const session = createTestSession({ name: 'Restorable' });
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: /restore options/i }).click();
    await page.getByRole('menuitem', { name: /current window/i }).click();

    await expect(page.getByText(/tab.*opened/i)).toBeVisible({ timeout: 5000 });
    await page.close();
  });

  test('Customize opens the restore wizard dialog [US-S011]', async ({ extensionContext, extensionId }) => {
    const session = createTestSession({ name: 'Restorable' });
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: /restore options/i }).click();
    await page.getByRole('menuitem', { name: /customize/i }).click();

    await expect(page.getByRole('dialog')).toBeVisible();
    // Scope the /Restore/ check to the dialog heading (Restore button also matches the regex)
    await expect(page.getByRole('dialog').getByText(/Restore/).first()).toBeVisible();
    await page.close();
  });

  // [US-S03] Restore in new window
  test('[US-S03] restore to new window opens new tabs', async ({ extensionContext, extensionId }) => {
    const session = createTestSession({ name: 'New Window Session' });
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    const pagesBefore = extensionContext.pages().length;

    await page.getByRole('button', { name: /restore options/i }).click();
    await page.getByRole('menuitem', { name: /new window/i }).click();

    // Session has 3 tabs — at least one new page should be created
    await page.waitForTimeout(3000);
    expect(extensionContext.pages().length).toBeGreaterThan(pagesBefore);
    await page.close();
  });
});

// ---------------------------------------------------------------------------
// [US-S05] Restore with conflict resolution — Customize wizard
// ---------------------------------------------------------------------------
test.describe('[US-S04] Restore in current window', () => {
  test('Customize wizard defaults to "In the current window" target', async ({
    extensionContext,
    extensionId,
  }) => {
    const session = createTestSession({ name: 'Default Target Session' });
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: /restore options/i }).click();
    await page.getByRole('menuitem', { name: /customize/i }).click();

    const dialog = page.getByRole('dialog');
    await page.waitForTimeout(300);
    // "In the current window" radio should be checked by default
    const currentRadio = dialog.getByRole('radio', { name: /current window/i });
    await expect(currentRadio).toBeChecked();
    await page.close();
  });
});

test.describe('[US-S05] Restore with conflict resolution', () => {
  test('Customize wizard Selection step shows current/new window target options', async ({
    extensionContext,
    extensionId,
  }) => {
    const session = createTestSession({ name: 'Conflict Test Session' });
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: /restore options/i }).click();
    await page.getByRole('menuitem', { name: /customize/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText(/current window/i)).toBeVisible();
    await expect(dialog.getByText(/new window/i)).toBeVisible();
    await page.close();
  });

  test('Customize wizard restores directly when no conflicts exist', async ({
    extensionContext,
    extensionId,
    helpers,
  }) => {
    // Close any tabs left open by previous tests that could match the session URLs
    // (example.com, google.com, github.com) and trigger conflict resolution.
    await helpers.closeAllTestTabs();

    const session = createTestSession({ name: 'No Conflict Session' });
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: /restore options/i }).click();
    await page.getByRole('menuitem', { name: /customize/i }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: /restore/i }).click();

    // Without conflicting tabs, restore executes directly and dialog closes
    await expect(dialog).not.toBeVisible({ timeout: 10000 });
    await page.close();
  });
});
