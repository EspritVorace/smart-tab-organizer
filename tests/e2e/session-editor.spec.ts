/**
 * E2E tests for the Session Editor dialog.
 * Covers: opening, tab/group editing, saving, cancel with unsaved changes.
 */
import { test, expect } from './fixtures';
import { goToSessionsSection } from './helpers/navigation';
import { seedSessions, clearSessions, clearHelpPrefs, getSessionsFromStorage, createTestSession } from './helpers/seed';

test.beforeEach(async ({ extensionContext }) => {
  await clearSessions(extensionContext);
  await clearHelpPrefs(extensionContext);
});

// ---------------------------------------------------------------------------
// Opening the editor
// ---------------------------------------------------------------------------
test.describe('[US-E01] Opening', () => {
  test('Edit item in more-actions menu opens the editor dialog', async ({
    extensionContext,
    extensionId,
  }) => {
    const session = createTestSession({ name: 'Editable Session' });
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('menuitem', { name: /edit/i }).click();

    await expect(page.getByTestId('dialog-session-edit')).toBeVisible();
    await expect(page.getByText('Edit Session')).toBeVisible();
    await page.close();
  });

  test('editor shows the session name in the name field [US-E001]', async ({ extensionContext, extensionId }) => {
    const session = createTestSession({ name: 'My Special Session' });
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('menuitem', { name: /edit/i }).click();

    const nameInput = page.getByTestId('dialog-session-edit-field-name');
    await expect(nameInput).toHaveValue('My Special Session');
    await page.close();
  });

  test('editor shows tab and group count summary [US-E003]', async ({ extensionContext, extensionId }) => {
    const session = createTestSession();
    // 2 tabs in group + 1 ungrouped = 3 tabs, 1 group
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
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
    extensionContext,
    extensionId,
  }) => {
    const session = createTestSession({ name: 'Before Edit' });
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('menuitem', { name: /edit/i }).click();

    const nameInput = page.getByTestId('dialog-session-edit-field-name');
    await nameInput.fill('After Edit');

    await page.getByTestId('dialog-session-edit-btn-save').click();

    await expect(page.getByTestId('dialog-session-edit')).not.toBeVisible();
    await expect(page.getByText('After Edit')).toBeVisible();

    const sessions = await getSessionsFromStorage(extensionContext);
    expect(sessions[0].name).toBe('After Edit');
    await page.close();
  });
});

// ---------------------------------------------------------------------------
// Cancel / unsaved changes guard
// ---------------------------------------------------------------------------
test.describe('[US-E01] Cancel and unsaved changes', () => {
  test('Cancel without changes closes the dialog immediately', async ({
    extensionContext,
    extensionId,
  }) => {
    const session = createTestSession({ name: 'Unchanged' });
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('menuitem', { name: /edit/i }).click();

    await page.getByTestId('dialog-session-edit-btn-cancel').click();

    await expect(page.getByTestId('dialog-session-edit')).not.toBeVisible();
    await page.close();
  });

  test('Cancel with unsaved changes shows confirmation alert [US-E005]', async ({ extensionContext, extensionId }) => {
    const session = createTestSession({ name: 'Has Changes' });
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('menuitem', { name: /edit/i }).click();

    // Make a change
    const nameInput = page.getByTestId('dialog-session-edit-field-name');
    await nameInput.fill('Modified Name');

    await page.getByTestId('dialog-session-edit-btn-cancel').click();

    // AlertDialog should appear asking about unsaved changes ("unsaved" appears in both title and body)
    await expect(page.getByRole('alertdialog')).toBeVisible();
    await expect(page.getByRole('alertdialog').getByText(/unsaved/i).first()).toBeVisible();
    await page.close();
  });

  test('Leave button in unsaved-changes dialog closes without saving [US-E005]', async ({
    extensionContext,
    extensionId,
  }) => {
    const session = createTestSession({ name: 'Original' });
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('menuitem', { name: /edit/i }).click();

    const nameInput = page.getByTestId('dialog-session-edit-field-name');
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
  test('editor displays tabs from the session', async ({ extensionContext, extensionId }) => {
    const session = createTestSession();
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('menuitem', { name: /edit/i }).click();

    // Scope to dialog; use exact:true since 'Example' also appears in 'example.com'
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Example', { exact: true })).toBeVisible();
    await expect(dialog.getByText('GitHub', { exact: true })).toBeVisible();
    await page.close();
  });

  test('deleting a tab removes it from the editor', async ({ extensionContext, extensionId }) => {
    const session = createTestSession({ name: 'Tab Delete Test' });
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('menuitem', { name: /edit/i }).click();

    const dialog = page.getByRole('dialog');
    // Scope to the GitHub listitem to avoid strict-mode violations (3 rows have 'Delete tab')
    const githubRow = dialog.getByRole('listitem').filter({ hasText: 'GitHub' });
    // Hover the right edge of the row (not just the title text) to verify the full row width is hoverable
    const box = await githubRow.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width - 8, box.y + box.height / 2);
    } else {
      await githubRow.hover();
    }
    await githubRow.getByRole('button', { name: 'Delete tab' }).click();

    // GitHub tab should be gone
    await expect(dialog.getByText('GitHub', { exact: true })).not.toBeVisible();
    await page.close();
  });

  test('editing a tab URL persists after save', async ({ extensionContext, extensionId }) => {
    const session = createTestSession({ name: 'URL Edit Test' });
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
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
    await page.getByTestId('dialog-session-edit-btn-save').click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Verify storage updated
    const sessions = await getSessionsFromStorage(extensionContext);
    const allUrls = [
      ...sessions[0].ungroupedTabs.map(t => t.url),
      ...sessions[0].groups.flatMap(g => g.tabs.map(t => t.url)),
    ];
    expect(allUrls).toContain('https://modified.example.com');
    await page.close();
  });

  test('renaming a group changes its title in the editor', async ({ extensionContext, extensionId }) => {
    const session = createTestSession({ name: 'Group Rename Test' });
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
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
    extensionContext,
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
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
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
    extensionContext,
    extensionId,
  }) => {
    const session = createTestSession({ name: 'Counter Test' });
    // starts with 3 tabs (2 in group + 1 ungrouped)
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
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
    extensionContext,
    extensionId,
  }) => {
    const session = createTestSession({ name: 'Group Deletion Test' });
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
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
    extensionContext,
    extensionId,
  }) => {
    const session = createTestSession({ name: 'Group Deletion Test' });
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
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
    extensionContext,
    extensionId,
  }) => {
    const session = createTestSession({ name: 'Group Deletion Test' });
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
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
    extensionContext,
    extensionId,
  }) => {
    const session = createTestSession({ name: 'Ungroup Test' });
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
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

// ---------------------------------------------------------------------------
// Collapsed/expanded group state (US-S018)
// ---------------------------------------------------------------------------
test.describe('[US-S018] Collapsed group state in editor', () => {
  test('a group with collapsed: true is displayed collapsed (tabs not visible)', async ({
    extensionContext,
    extensionId,
  }) => {
    const session = createTestSession({ name: 'Collapsed Test' });
    session.groups[0].collapsed = true;
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('menuitem', { name: /edit/i }).click();

    const dialog = page.getByRole('dialog');
    // Group header should be visible
    await expect(dialog.getByText('Work', { exact: true })).toBeVisible();
    // Tabs inside the collapsed group should NOT be visible
    await expect(dialog.getByText('Example', { exact: true })).not.toBeVisible();
    await expect(dialog.getByText('Google', { exact: true })).not.toBeVisible();
    await page.close();
  });

  test('a group without collapsed field is displayed expanded (tabs visible)', async ({
    extensionContext,
    extensionId,
  }) => {
    const session = createTestSession({ name: 'Expanded Test' });
    // No collapsed field set (default behavior)
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('menuitem', { name: /edit/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Work', { exact: true })).toBeVisible();
    // Tabs inside the expanded group should be visible
    await expect(dialog.getByText('Example', { exact: true })).toBeVisible();
    await page.close();
  });

  test('toggling collapse then saving persists collapsed: true in storage', async ({
    extensionContext,
    extensionId,
  }) => {
    const session = createTestSession({ name: 'Toggle Test' });
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('menuitem', { name: /edit/i }).click();

    const dialog = page.getByRole('dialog');
    // Tabs should be visible (group starts expanded)
    await expect(dialog.getByText('Example', { exact: true })).toBeVisible();

    // Click the expand/collapse toggle on the group row
    await dialog.getByRole('button', { name: /collapse group/i }).click();

    // Tabs should now be hidden
    await expect(dialog.getByText('Example', { exact: true })).not.toBeVisible();

    // Save
    await page.getByTestId('dialog-session-edit-btn-save').click();
    await expect(dialog).not.toBeVisible();

    // Verify storage
    const sessions = await getSessionsFromStorage(extensionContext);
    expect(sessions[0].groups[0].collapsed).toBe(true);
    await page.close();
  });
});
