/**
 * E2E tests for the Session Editor dialog.
 * Covers: opening, tab/group editing, saving, cancel with unsaved changes.
 */
import { test, expect } from './fixtures';
import { goToSessionsSection } from './helpers/navigation';
import { seedSessions, clearSessions, getSessionsFromStorage, createTestSession } from './helpers/seed';
import { auditPage } from './helpers/a11y';
import { SessionEditorPage } from '../../e2e-shared/pages/index.js';

test.beforeEach(async ({ extensionContext }) => {
  await clearSessions(extensionContext);
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

    const editor = new SessionEditorPage(page);
    await editor.openFromFirstSessionMenu();
    await expect(page.getByText('Edit Session')).toBeVisible();
    await auditPage(page, 'session-editor-dialog-open', { include: '[role="dialog"]' });
    await page.close();
  });

  test('editor shows the session name in the name field [US-E001]', async ({ extensionContext, extensionId }) => {
    const session = createTestSession({ name: 'My Special Session' });
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    const editor = new SessionEditorPage(page);
    await editor.openFromFirstSessionMenu();

    await expect(editor.nameInput()).toHaveValue('My Special Session');
    await page.close();
  });

  test('editor shows tab and group count summary [US-E003]', async ({ extensionContext, extensionId }) => {
    const session = createTestSession();
    // 2 tabs in group + 1 ungrouped = 3 tabs, 1 group
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    const editor = new SessionEditorPage(page);
    await editor.openFromFirstSessionMenu();

    await editor.expectCounterVisible(/3 tab/i);
    await editor.expectCounterVisible(/1 group/i);
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

    const editor = new SessionEditorPage(page);
    await editor.openFromFirstSessionMenu();

    await editor.fillName('After Edit');
    await editor.clickSave();

    await editor.expectHidden();
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

    const editor = new SessionEditorPage(page);
    await editor.openFromFirstSessionMenu();

    await editor.clickCancel();
    await editor.expectHidden();
    await page.close();
  });

  test('Cancel with unsaved changes shows confirmation alert [US-E005]', async ({ extensionContext, extensionId }) => {
    const session = createTestSession({ name: 'Has Changes' });
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    const editor = new SessionEditorPage(page);
    await editor.openFromFirstSessionMenu();

    await editor.fillName('Modified Name');
    await editor.clickCancel();

    await editor.expectUnsavedAlertVisible();
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

    const editor = new SessionEditorPage(page);
    await editor.openFromFirstSessionMenu();

    await editor.fillName('Will Not Save');
    await editor.clickCancel();
    await editor.confirmLeaveUnsaved();

    await editor.expectHidden();
    await expect(page.getByText('Original')).toBeVisible();
    await expect(page.getByText('Will Not Save')).toBeHidden();
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

    const editor = new SessionEditorPage(page);
    await editor.openFromFirstSessionMenu();

    // Use exact:true since 'Example' also appears in 'example.com'
    await editor.expectTextVisible('Example', { exact: true });
    await editor.expectTextVisible('GitHub', { exact: true });
    await page.close();
  });

  test('deleting a tab removes it from the editor', async ({ extensionContext, extensionId }) => {
    const session = createTestSession({ name: 'Tab Delete Test' });
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    const editor = new SessionEditorPage(page);
    await editor.openFromFirstSessionMenu();

    // Scope to the GitHub listitem to avoid strict-mode violations (3 rows have 'Delete tab').
    // Hover the right edge of the row (not just the title text) to verify the full row width is hoverable.
    const githubRow = editor.rowByText('GitHub');
    const box = await githubRow.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.move(box!.x + box!.width - 8, box!.y + box!.height / 2);
    await githubRow.getByRole('button', { name: 'Delete tab' }).click();

    await editor.expectTextHidden('GitHub', { exact: true });
    await page.close();
  });

  test('editing a tab URL persists after save', async ({ extensionContext, extensionId }) => {
    const session = createTestSession({ name: 'URL Edit Test' });
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    const editor = new SessionEditorPage(page);
    await editor.openFromFirstSessionMenu();

    await editor.editTab('GitHub');
    await editor.fillTabUrlAndCommit('https://modified.example.com');

    await editor.clickSave();
    await editor.expectHidden();

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

    const editor = new SessionEditorPage(page);
    await editor.openFromFirstSessionMenu();

    await editor.editGroup('Work');
    await editor.fillGroupNameAndCommit('Renamed Group');

    await editor.expectTextVisible('Renamed Group', { exact: true });
    await editor.expectTextHidden('Work', { exact: true });
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

    const editor = new SessionEditorPage(page);
    await editor.openFromFirstSessionMenu();

    await editor.openMoveTabDropdown('Example');
    await editor.selectMoveTarget('Personal');

    // The Work group should have lost one tab (Google remains, Example moved)
    // Work group now shows count (1)
    const workRow = editor.rowByText('Work').first();
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

    const editor = new SessionEditorPage(page);
    await editor.openFromFirstSessionMenu();

    await editor.expectCounterVisible(/3 tab/i);

    await editor.deleteTab('GitHub');

    await editor.expectCounterVisible(/2 tab/i);
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

    const editor = new SessionEditorPage(page);
    await editor.openFromFirstSessionMenu();

    await editor.rowByText('Work').first().hover();
    await expect(editor.dialog().getByRole('button', { name: 'Delete group' })).toBeVisible();
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

    const editor = new SessionEditorPage(page);
    await editor.openFromFirstSessionMenu();

    await editor.openDeleteGroupAlert('Work');
    await editor.expectDeleteGroupAlertVisible();
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

    const editor = new SessionEditorPage(page);
    await editor.openFromFirstSessionMenu();

    await editor.openDeleteGroupAlert('Work');
    await editor.confirmDeleteGroupAndTabs();

    await editor.expectTextHidden('Work', { exact: true });
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

    const editor = new SessionEditorPage(page);
    await editor.openFromFirstSessionMenu();

    await editor.openDeleteGroupAlert('Work');
    await editor.confirmUngroupTabs();

    await editor.expectTextHidden('Work', { exact: true });
    await editor.expectTextVisible('Example', { exact: true });
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

    const editor = new SessionEditorPage(page);
    await editor.openFromFirstSessionMenu();

    await editor.expectTextVisible('Work', { exact: true });
    await editor.expectTextHidden('Example', { exact: true });
    await editor.expectTextHidden('Google', { exact: true });
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

    const editor = new SessionEditorPage(page);
    await editor.openFromFirstSessionMenu();

    await editor.expectTextVisible('Work', { exact: true });
    await editor.expectTextVisible('Example', { exact: true });
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

    const editor = new SessionEditorPage(page);
    await editor.openFromFirstSessionMenu();

    await editor.expectTextVisible('Example', { exact: true });

    await editor.toggleCollapseGroup();

    await editor.expectTextHidden('Example', { exact: true });

    await editor.clickSave();
    await editor.expectHidden();

    const sessions = await getSessionsFromStorage(extensionContext);
    expect(sessions[0].groups[0].collapsed).toBe(true);
    await page.close();
  });
});
