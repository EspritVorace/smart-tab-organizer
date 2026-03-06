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
test.describe('Opening', () => {
  test('Edit item in more-actions menu opens the editor dialog [US-E001]', async ({
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

  test('editor shows the session name in the name field [US-E001]', async ({ context, extensionId }) => {
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

  test('editor shows tab and group count summary [US-E003]', async ({ context, extensionId }) => {
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
test.describe('Name editing', () => {
  test('changing the session name and saving persists the new name [US-E002]', async ({
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
test.describe('Cancel and unsaved changes', () => {
  test('Cancel without changes closes the dialog immediately [US-E005]', async ({
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

  test('Cancel with unsaved changes shows confirmation alert [US-E005]', async ({ context, extensionId }) => {
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

  test('Leave button in unsaved-changes dialog closes without saving [US-E005]', async ({
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
test.describe('Tab tree', () => {
  test('editor displays tabs from the session [US-E004]', async ({ context, extensionId }) => {
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
});
