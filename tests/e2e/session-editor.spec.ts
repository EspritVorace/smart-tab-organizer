/**
 * E2E tests for the Session Editor dialog.
 * Covers: opening, tab/group editing, saving, cancel with unsaved changes.
 */
import { test, expect } from './fixtures';
import { goToSessionsSection } from './helpers/navigation';
import { seedSessions, clearSessions, clearHelpPrefs, getSessionsFromStorage, createTestSession } from './helpers/seed';

test.beforeEach(async ({ context }) => {
  await clearSessions(context);
  await clearHelpPrefs(context);
});

// ---------------------------------------------------------------------------
// Opening the editor
// ---------------------------------------------------------------------------
test.describe('[US-E01] Opening', () => {
  test('Edit item in more-actions menu opens the editor dialog', async ({
    context,
    extensionId,
  }) => {
    const session = createTestSession({ name: 'Editable Session' });
    await seedSessions(context, [session]);

    const page = await context.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('menuitem', { name: /edit/i }).click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Edit Session')).toBeVisible();
    await page.close();
  });

  test('editor shows the session name in the name field', async ({ context, extensionId }) => {
    const session = createTestSession({ name: 'My Special Session' });
    await seedSessions(context, [session]);

    const page = await context.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('menuitem', { name: /edit/i }).click();

    const nameInput = page.getByRole('textbox', { name: /name/i });
    await expect(nameInput).toHaveValue('My Special Session');
    await page.close();
  });

  test('editor shows tab and group count summary', async ({ context, extensionId }) => {
    const session = createTestSession();
    // 2 tabs in group + 1 ungrouped = 3 tabs, 1 group
    await seedSessions(context, [session]);

    const page = await context.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('menuitem', { name: /edit/i }).click();

    // Scope to dialog to avoid matching the same count on the session card
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText(/3 tab/i)).toBeVisible();
    await expect(dialog.getByText(/1 group/i)).toBeVisible();
    await page.close();
  });
});

// ---------------------------------------------------------------------------
// Editing name
// ---------------------------------------------------------------------------
test.describe('[US-E01] Name editing', () => {
  test('changing the session name and saving persists the new name', async ({
    context,
    extensionId,
  }) => {
    const session = createTestSession({ name: 'Before Edit' });
    await seedSessions(context, [session]);

    const page = await context.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('menuitem', { name: /edit/i }).click();

    const nameInput = page.getByRole('textbox', { name: /name/i });
    await nameInput.fill('After Edit');

    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByText('After Edit')).toBeVisible();

    const sessions = await getSessionsFromStorage(context);
    expect(sessions[0].name).toBe('After Edit');
    await page.close();
  });
});

// ---------------------------------------------------------------------------
// Cancel / unsaved changes guard
// ---------------------------------------------------------------------------
test.describe('[US-E01] Cancel and unsaved changes', () => {
  test('Cancel without changes closes the dialog immediately', async ({
    context,
    extensionId,
  }) => {
    const session = createTestSession({ name: 'Unchanged' });
    await seedSessions(context, [session]);

    const page = await context.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('menuitem', { name: /edit/i }).click();

    await page.getByRole('button', { name: /cancel/i }).click();

    await expect(page.getByRole('dialog')).not.toBeVisible();
    await page.close();
  });

  test('Cancel with unsaved changes shows confirmation alert', async ({ context, extensionId }) => {
    const session = createTestSession({ name: 'Has Changes' });
    await seedSessions(context, [session]);

    const page = await context.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('menuitem', { name: /edit/i }).click();

    // Make a change
    const nameInput = page.getByRole('textbox', { name: /name/i });
    await nameInput.fill('Modified Name');

    await page.getByRole('button', { name: /cancel/i }).click();

    // AlertDialog should appear asking about unsaved changes ("unsaved" appears in both title and body)
    await expect(page.getByRole('alertdialog')).toBeVisible();
    await expect(page.getByRole('alertdialog').getByText(/unsaved/i).first()).toBeVisible();
    await page.close();
  });

  test('Leave button in unsaved-changes dialog closes without saving', async ({
    context,
    extensionId,
  }) => {
    const session = createTestSession({ name: 'Original' });
    await seedSessions(context, [session]);

    const page = await context.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('menuitem', { name: /edit/i }).click();

    const nameInput = page.getByRole('textbox', { name: /name/i });
    await nameInput.fill('Will Not Save');

    await page.getByRole('button', { name: /cancel/i }).click();
    await page.getByRole('button', { name: /leave/i }).click();

    // Both dialogs should be closed
    await expect(page.getByRole('dialog')).not.toBeVisible();
    // The session name should be unchanged
    await expect(page.getByText('Original')).toBeVisible();
    await expect(page.getByText('Will Not Save')).not.toBeVisible();
    await page.close();
  });
});

// ---------------------------------------------------------------------------
// Tab tree interactions
// ---------------------------------------------------------------------------
test.describe('[US-E01] Tab tree', () => {
  test('editor displays tabs from the session', async ({ context, extensionId }) => {
    const session = createTestSession();
    await seedSessions(context, [session]);

    const page = await context.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('menuitem', { name: /edit/i }).click();

    // Scope to dialog; use exact:true since 'Example' also appears in 'example.com'
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Example', { exact: true })).toBeVisible();
    await expect(dialog.getByText('GitHub', { exact: true })).toBeVisible();
    await page.close();
  });

  test('deleting a tab removes it from the editor', async ({ context, extensionId }) => {
    const session = createTestSession({ name: 'Tab Delete Test' });
    await seedSessions(context, [session]);

    const page = await context.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('menuitem', { name: /edit/i }).click();

    const dialog = page.getByRole('dialog');
    // Scope to the GitHub listitem to avoid strict-mode violations (3 rows have 'Delete tab')
    const githubRow = dialog.getByRole('listitem').filter({ hasText: 'GitHub' });
    await githubRow.hover();
    await githubRow.getByRole('button', { name: 'Delete tab' }).click();

    // GitHub tab should be gone
    await expect(dialog.getByText('GitHub', { exact: true })).not.toBeVisible();
    await page.close();
  });

  test('editing a tab URL persists after save', async ({ context, extensionId }) => {
    const session = createTestSession({ name: 'URL Edit Test' });
    await seedSessions(context, [session]);

    const page = await context.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('menuitem', { name: /edit/i }).click();

    const dialog = page.getByRole('dialog');
    // Scope to the GitHub listitem to avoid strict-mode violations
    const githubRow = dialog.getByRole('listitem').filter({ hasText: 'GitHub' });
    await githubRow.hover();
    await githubRow.getByRole('button', { name: 'Edit tab' }).click();

    // Replace the URL
    const urlInput = dialog.getByRole('textbox', { name: /url/i });
    await urlInput.clear();
    await urlInput.fill('https://modified.example.com');
    await urlInput.press('Enter');

    // Save the session
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Verify storage updated
    const sessions = await getSessionsFromStorage(context);
    const allUrls = [
      ...sessions[0].ungroupedTabs.map(t => t.url),
      ...sessions[0].groups.flatMap(g => g.tabs.map(t => t.url)),
    ];
    expect(allUrls).toContain('https://modified.example.com');
    await page.close();
  });

  test('renaming a group changes its title in the editor', async ({ context, extensionId }) => {
    const session = createTestSession({ name: 'Group Rename Test' });
    await seedSessions(context, [session]);

    const page = await context.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('menuitem', { name: /edit/i }).click();

    const dialog = page.getByRole('dialog');
    // Hover the group row and click Edit group
    await dialog.getByRole('listitem').filter({ hasText: 'Work' }).first().hover();
    await dialog.getByRole('button', { name: 'Edit group' }).click();

    // Rename in the inline text field
    const nameInput = dialog.getByRole('textbox', { name: /group name/i });
    await nameInput.clear();
    await nameInput.fill('Renamed Group');
    await nameInput.press('Enter');

    await expect(dialog.getByText('Renamed Group', { exact: true })).toBeVisible();
    await expect(dialog.getByText('Work', { exact: true })).not.toBeVisible();
    await page.close();
  });

  test('moving a tab to another group removes it from original group', async ({
    context,
    extensionId,
  }) => {
    // Create session with 2 groups so a tab can be moved between them
    const session = createTestSession({ name: 'Move Tab Test' });
    session.groups.push({
      id: 'group-2',
      title: 'Personal',
      color: 'green',
      tabs: [{ id: 'tab-p1', title: 'Wikipedia', url: 'https://wikipedia.org' }],
    });
    await seedSessions(context, [session]);

    const page = await context.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('menuitem', { name: /edit/i }).click();

    const dialog = page.getByRole('dialog');
    // Hover Example tab (in Work group) and open Move dropdown
    const exampleRow = dialog.getByRole('listitem').filter({ hasText: 'Example' });
    await exampleRow.hover();
    await exampleRow.getByRole('button', { name: 'Move tab to group' }).click();
    // Choose Personal as target
    await page.getByRole('menuitem', { name: 'Personal' }).click();

    // The Work group should have lost one tab (Google remains, Example moved)
    // Work group now shows count (1)
    const workRow = dialog.getByRole('listitem').filter({ hasText: 'Work' }).first();
    await expect(workRow.getByText('(1)')).toBeVisible();
    await page.close();
  });

  test('tab and group counters update in real time after deletion', async ({
    context,
    extensionId,
  }) => {
    const session = createTestSession({ name: 'Counter Test' });
    // starts with 3 tabs (2 in group + 1 ungrouped)
    await seedSessions(context, [session]);

    const page = await context.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('menuitem', { name: /edit/i }).click();

    const dialog = page.getByRole('dialog');
    // Verify initial count
    await expect(dialog.getByText(/3 tab/i)).toBeVisible();

    // Delete the ungrouped GitHub tab
    const githubRow = dialog.getByRole('listitem').filter({ hasText: 'GitHub' });
    await githubRow.hover();
    await githubRow.getByRole('button', { name: 'Delete tab' }).click();

    // Counter should update to 2 tabs
    await expect(dialog.getByText(/2 tab/i)).toBeVisible();
    await page.close();
  });
});

// ---------------------------------------------------------------------------
// Delete group (US-E02)
// ---------------------------------------------------------------------------
test.describe('[US-E02] Delete group', () => {
  test('delete group button is visible on hover over a group row', async ({
    context,
    extensionId,
  }) => {
    const session = createTestSession({ name: 'Group Deletion Test' });
    await seedSessions(context, [session]);

    const page = await context.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('menuitem', { name: /edit/i }).click();

    const dialog = page.getByRole('dialog');
    // Hover the group row to reveal the action buttons
    await dialog.getByRole('listitem').filter({ hasText: 'Work' }).first().hover();
    await expect(dialog.getByRole('button', { name: 'Delete group' })).toBeVisible();
    await page.close();
  });

  test('clicking delete group opens a confirmation dialog', async ({
    context,
    extensionId,
  }) => {
    const session = createTestSession({ name: 'Group Deletion Test' });
    await seedSessions(context, [session]);

    const page = await context.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('menuitem', { name: /edit/i }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByRole('listitem').filter({ hasText: 'Work' }).first().hover();
    await dialog.getByRole('button', { name: 'Delete group' }).click();

    // AlertDialog for group deletion should appear
    await expect(page.getByRole('alertdialog')).toBeVisible();
    await page.close();
  });

  test('choosing "Delete group and tabs" removes the group from the editor', async ({
    context,
    extensionId,
  }) => {
    const session = createTestSession({ name: 'Group Deletion Test' });
    await seedSessions(context, [session]);

    const page = await context.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('menuitem', { name: /edit/i }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByRole('listitem').filter({ hasText: 'Work' }).first().hover();
    await dialog.getByRole('button', { name: 'Delete group' }).click();

    // Click the destructive "Delete group and N tab(s)" button
    await page.getByRole('button', { name: /delete group and/i }).click();

    // Group 'Work' should no longer appear in the editor
    await expect(dialog.getByText('Work', { exact: true })).not.toBeVisible();
    await page.close();
  });

  test('choosing "Ungroup tabs" moves tabs to ungrouped section', async ({
    context,
    extensionId,
  }) => {
    const session = createTestSession({ name: 'Ungroup Test' });
    await seedSessions(context, [session]);

    const page = await context.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('menuitem', { name: /edit/i }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByRole('listitem').filter({ hasText: 'Work' }).first().hover();
    await dialog.getByRole('button', { name: 'Delete group' }).click();

    // Choose to ungroup tabs rather than delete them
    await page.getByRole('button', { name: /ungroup/i }).click();

    // Group 'Work' is gone, but its tabs remain (now ungrouped)
    await expect(dialog.getByText('Work', { exact: true })).not.toBeVisible();
    await expect(dialog.getByText('Example', { exact: true })).toBeVisible();
    await page.close();
  });
});
