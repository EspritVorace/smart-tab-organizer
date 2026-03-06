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
  createTestProfile,
} from './helpers/seed';

test.beforeEach(async ({ context }) => {
  await clearSessions(context);
  await clearHelpPrefs(context);
});

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------
test.describe('Empty state', () => {
  test('shows empty state title and description when no sessions exist [US-S007]', async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();
    await goToSessionsSection(page, extensionId);

    await expect(page.getByText('No saved sessions.')).toBeVisible();
    await expect(
      page.getByText(/snapshot|profile/i).first(),
    ).toBeVisible();
    await page.close();
  });

  test('shows Take Snapshot and New Profile buttons in empty state [US-S010]', async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();
    await goToSessionsSection(page, extensionId);

    // Both header and empty-state render these buttons, so use first()
    await expect(page.getByRole('button', { name: 'Take Snapshot' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'New Profile' }).first()).toBeVisible();
    await page.close();
  });

  test('shows intro callout on first visit [US-O001]', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await goToSessionsSection(page, extensionId);

    await expect(page.getByText('Sessions & Profiles')).toBeVisible();
    await page.close();
  });
});

// ---------------------------------------------------------------------------
// Session list rendering
// ---------------------------------------------------------------------------
test.describe('Session list', () => {
  test('displays session cards with name and tab counts [US-S002]', async ({ context, extensionId }) => {
    const session = createTestSession({ name: 'My Work Tabs' });
    await seedSessions(context, [session]);

    const page = await context.newPage();
    await goToSessionsSection(page, extensionId);

    await expect(page.getByText('My Work Tabs')).toBeVisible();
    // 2 tabs in group + 1 ungrouped = 3 tabs total
    await expect(page.getByText(/3 tab/i)).toBeVisible();
    await page.close();
  });

  test('renders multiple sessions [US-S002]', async ({ context, extensionId }) => {
    const sessions = [
      createTestSession({ name: 'Session A' }),
      createTestSession({ name: 'Session B' }),
      createTestSession({ name: 'Session C' }),
    ];
    await seedSessions(context, sessions);

    const page = await context.newPage();
    await goToSessionsSection(page, extensionId);

    // Use exact:true to avoid matching "session as" in the intro callout body
    await expect(page.getByText('Session A', { exact: true })).toBeVisible();
    await expect(page.getByText('Session B', { exact: true })).toBeVisible();
    await expect(page.getByText('Session C', { exact: true })).toBeVisible();
    await page.close();
  });

  test('sorts profiles (pinned) before snapshots [US-S008]', async ({ context, extensionId }) => {
    const snapshot = createTestSession({ name: 'Snapshot Session' });
    const profile = createTestProfile({ name: 'Profile Session' });
    // Seed snapshot first so ordering is deliberately wrong without sort
    await seedSessions(context, [snapshot, profile]);

    const page = await context.newPage();
    await goToSessionsSection(page, extensionId);

    const cards = page.getByText(/Session/i);
    const texts = await cards.allTextContents();
    const profileIdx = texts.findIndex(t => t.includes('Profile Session'));
    const snapshotIdx = texts.findIndex(t => t.includes('Snapshot Session'));
    expect(profileIdx).toBeLessThan(snapshotIdx);
    await page.close();
  });

  test('profile card shows auto-sync toggle [US-S009]', async ({ context, extensionId }) => {
    const profile = createTestProfile();
    await seedSessions(context, [profile]);

    const page = await context.newPage();
    await goToSessionsSection(page, extensionId);

    await expect(page.getByRole('switch', { name: /auto-sync/i })).toBeVisible();
    await page.close();
  });

  test('snapshot card does not show auto-sync toggle [US-S009]', async ({ context, extensionId }) => {
    const session = createTestSession();
    await seedSessions(context, [session]);

    const page = await context.newPage();
    await goToSessionsSection(page, extensionId);

    await expect(page.getByRole('switch', { name: /auto-sync/i })).not.toBeVisible();
    await page.close();
  });
});

// ---------------------------------------------------------------------------
// Rename
// ---------------------------------------------------------------------------
test.describe('Rename', () => {
  test('double-click on session name enters rename mode [US-S003]', async ({ context, extensionId }) => {
    const session = createTestSession({ name: 'Original Name' });
    await seedSessions(context, [session]);

    const page = await context.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByText('Original Name').dblclick();
    // Rename input should be visible
    await expect(page.getByRole('textbox', { name: /session name/i })).toBeVisible();
    await page.close();
  });

  test('pressing Enter confirms the new name [US-S003]', async ({ context, extensionId }) => {
    const session = createTestSession({ name: 'Old Name' });
    await seedSessions(context, [session]);

    const page = await context.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByText('Old Name').dblclick();
    const input = page.getByRole('textbox', { name: /session name/i });
    await input.fill('New Name');
    await input.press('Enter');

    await expect(page.getByText('New Name')).toBeVisible();
    await expect(page.getByText('Old Name')).not.toBeVisible();
    await page.close();
  });

  test('pressing Escape cancels rename [US-S003]', async ({ context, extensionId }) => {
    const session = createTestSession({ name: 'Stable Name' });
    await seedSessions(context, [session]);

    const page = await context.newPage();
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
test.describe('Delete', () => {
  test('more-actions menu contains Delete option [US-S004]', async ({ context, extensionId }) => {
    const session = createTestSession({ name: 'Deletable Session' });
    await seedSessions(context, [session]);

    const page = await context.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: 'More actions' }).click();
    await expect(page.getByRole('menuitem', { name: /delete/i })).toBeVisible();
    await page.close();
  });

  test('clicking Delete opens confirmation dialog [US-S004]', async ({ context, extensionId }) => {
    const session = createTestSession({ name: 'To Be Deleted' });
    await seedSessions(context, [session]);

    const page = await context.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('menuitem', { name: /delete/i }).click();

    // ConfirmDialog should appear
    await expect(page.getByRole('alertdialog')).toBeVisible();
    await page.close();
  });

  test('confirming Delete removes the session card [US-S004]', async ({ context, extensionId }) => {
    const session = createTestSession({ name: 'To Be Deleted' });
    await seedSessions(context, [session]);

    const page = await context.newPage();
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

  test('cancelling Delete keeps the session [US-S004]', async ({ context, extensionId }) => {
    const session = createTestSession({ name: 'Will Survive' });
    await seedSessions(context, [session]);

    const page = await context.newPage();
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
test.describe('Snapshot creation', () => {
  test('Take Snapshot button opens the snapshot wizard dialog [US-S001]', async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: 'Take Snapshot' }).first().click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Save Session Snapshot')).toBeVisible();
    await page.close();
  });

  test('wizard step 1 shows Selection step [US-S001]', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: 'Take Snapshot' }).first().click();

    await expect(page.getByText('Selection')).toBeVisible();
    await page.close();
  });

  test('Next button advances to Confirmation step [US-S001]', async ({ context, extensionId }) => {
    // captureCurrentTabs() filters out chrome-extension:// URLs, so open a real tab first
    const extraTab = await context.newPage();
    await extraTab.goto('data:text/html,<p>test tab for snapshot</p>');

    const page = await context.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: 'Take Snapshot' }).first().click();
    await page.waitForTimeout(800); // wait for tab capture to complete

    await page.getByRole('button', { name: 'Next' }).click();

    await expect(page.getByText('Confirmation')).toBeVisible();
    await extraTab.close();
    await page.close();
  });

  test('Save Session button on confirmation step creates session [US-S001]', async ({
    context,
    extensionId,
  }) => {
    // captureCurrentTabs() filters out chrome-extension:// URLs, so open a real tab first
    const extraTab = await context.newPage();
    await extraTab.goto('data:text/html,<p>test tab for snapshot</p>');

    const page = await context.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: 'Take Snapshot' }).first().click();
    await page.waitForTimeout(800);

    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Save Session' }).click();

    // After saving, the wizard shows a success callout; click Close to dismiss
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    const sessions = await getSessionsFromStorage(context);
    expect(sessions.length).toBe(1);
    expect(sessions[0].isPinned).toBe(false);
    await extraTab.close();
    await page.close();
  });
});

// ---------------------------------------------------------------------------
// Restore — split button
// ---------------------------------------------------------------------------
test.describe('Restore split button', () => {
  test('Restore button is visible on session card [US-S011]', async ({ context, extensionId }) => {
    const session = createTestSession({ name: 'Restorable' });
    await seedSessions(context, [session]);

    const page = await context.newPage();
    await goToSessionsSection(page, extensionId);

    // 'Restore' may match multiple buttons; use first() to pick the main restore button
    await expect(page.getByRole('button', { name: 'Restore' }).first()).toBeVisible();
    await page.close();
  });

  test('split button dropdown contains quick restore options [US-S011]', async ({ context, extensionId }) => {
    const session = createTestSession({ name: 'Restorable' });
    await seedSessions(context, [session]);

    const page = await context.newPage();
    await goToSessionsSection(page, extensionId);

    // Click the dropdown chevron of the split button
    await page.getByRole('button', { name: /restore options/i }).click();

    await expect(page.getByRole('menuitem', { name: /current window/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /new window/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /customize/i })).toBeVisible();
    await page.close();
  });

  test('quick restore in current window shows success callout [US-S011]', async ({
    context,
    extensionId,
  }) => {
    const session = createTestSession({ name: 'Restorable' });
    await seedSessions(context, [session]);

    const page = await context.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: /restore options/i }).click();
    await page.getByRole('menuitem', { name: /current window/i }).click();

    await expect(page.getByText(/tab.*opened/i)).toBeVisible({ timeout: 5000 });
    await page.close();
  });

  test('Customize opens the restore wizard dialog [US-S011]', async ({ context, extensionId }) => {
    const session = createTestSession({ name: 'Restorable' });
    await seedSessions(context, [session]);

    const page = await context.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: /restore options/i }).click();
    await page.getByRole('menuitem', { name: /customize/i }).click();

    await expect(page.getByRole('dialog')).toBeVisible();
    // Scope the /Restore/ check to the dialog to avoid matching the session card's Restore button
    await expect(page.getByRole('dialog').getByText(/Restore/)).toBeVisible();
    await page.close();
  });
});
