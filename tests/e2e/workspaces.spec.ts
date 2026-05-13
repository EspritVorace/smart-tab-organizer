/**
 * E2E Tests — Workspaces (US Workspaces #1)
 *
 * Covers:
 * - Default workspace appears after migration
 * - Switcher dropdown lists workspaces and exposes Manage entry
 * - Create a workspace from the management page
 * - Switching applies the accent color to the Radix Theme
 * - Delete safeguards (default not removable, last not removable)
 * - Confirmation requires retyping the name
 */

import { test, expect } from './fixtures';
import { goToOptionsPage } from './helpers/navigation';

async function goToWorkspaces(page: import('@playwright/test').Page, extensionId: string) {
  await page.goto(`chrome-extension://${extensionId}/options.html#workspaces`);
  await page.waitForLoadState('domcontentloaded');
  await page.getByTestId('workspace-create-button').waitFor({ state: 'visible', timeout: 10_000 });
}

// Other spec files in the same worker (notably workspaces-search.spec.ts) call
// the create-workspace UI, which adds workspaces to storage and auto-switches
// `activeWorkspaceId` to the new one. Storage is shared by extensionContext
// across spec files, so leftover state leaks here and breaks both the
// "default is active" assertion and the "create Personal" flow (the form
// rejects names that already exist). Reset to a post-migration baseline
// before each test: only the default workspace, and it is active.
test.beforeEach(async ({ extensionContext }) => {
  const sw = extensionContext.serviceWorkers()[0];
  if (!sw) return;
  await sw
    .evaluate(async () => {
      const { workspaces } = await chrome.storage.local.get('workspaces');
      const defaultOnly = Array.isArray(workspaces)
        ? workspaces.filter((w) => (w as { id: string }).id === 'default')
        : null;
      const update: Record<string, unknown> = { activeWorkspaceId: 'default' };
      if (defaultOnly && defaultOnly.length > 0) {
        update.workspaces = defaultOnly;
      }
      await chrome.storage.local.set(update);
    })
    .catch(() => {
      // SW may be evicted; the test will surface the real failure if any.
    });
});

test.describe('Workspaces — baseline', () => {
  test('default workspace is migrated and active', async ({ optionsPage, extensionId }) => {
    await goToWorkspaces(optionsPage, extensionId);

    // The default workspace row exists and is marked as both Active and Default.
    const defaultRow = optionsPage.getByTestId('workspace-row-default');
    await expect(defaultRow).toBeVisible();
    await expect(optionsPage.getByTestId('workspace-row-default-active')).toBeVisible();
    await expect(optionsPage.getByTestId('workspace-row-default-default')).toBeVisible();

    // The footer mirrors the active workspace.
    await expect(optionsPage.getByTestId('workspace-footer-trigger')).toBeVisible();
  });

  test('default workspace cannot be deleted', async ({ optionsPage, extensionId }) => {
    await goToWorkspaces(optionsPage, extensionId);

    const deleteBtn = optionsPage.getByTestId('workspace-row-default-delete');
    await expect(deleteBtn).toBeDisabled();
  });
});

test.describe('Workspaces — create + switch + delete', () => {
  test('create a workspace, switch to it, then delete with name confirmation', async ({
    optionsPage,
    extensionId,
  }) => {
    await goToWorkspaces(optionsPage, extensionId);

    // Open the create dialog.
    await optionsPage.getByTestId('workspace-create-button').click();
    await expect(optionsPage.getByTestId('workspace-form-dialog')).toBeVisible();

    // Fill name and pick a non-default color.
    await optionsPage.getByTestId('workspace-form-name').fill('Personal');
    await optionsPage.getByTestId('workspace-color-swatch-jade').click();
    await optionsPage.getByTestId('workspace-form-btn-submit').click();

    // The new workspace should appear and become the active one.
    await expect(optionsPage.getByText('Personal').first()).toBeVisible();
    await expect(optionsPage.locator('[data-accent-color]').first()).toHaveAttribute(
      'data-accent-color',
      'jade',
      { timeout: 5_000 },
    );

    // Switch back to the default workspace via the inline button.
    await optionsPage.getByTestId('workspace-row-default-switch').click();
    await expect(optionsPage.locator('[data-accent-color]').first()).toHaveAttribute(
      'data-accent-color',
      'indigo',
      { timeout: 5_000 },
    );

    // Locate the Personal row by its visible name to retrieve its id-bound
    // delete button (the id is a UUID generated at runtime).
    const personalRow = optionsPage.locator('[data-testid^="workspace-row-"]', {
      hasText: 'Personal',
    });
    await expect(personalRow).toBeVisible();

    const personalRowId = await personalRow.getAttribute('data-testid');
    const wsId = personalRowId!.replace('workspace-row-', '');
    await optionsPage.getByTestId(`workspace-row-${wsId}-delete`).click();

    // Confirmation requires retyping the name.
    const dialog = optionsPage.getByTestId('workspace-delete-dialog');
    await expect(dialog).toBeVisible();
    const confirmBtn = optionsPage.getByTestId('workspace-delete-btn-confirm');
    await expect(confirmBtn).toBeDisabled();

    await optionsPage.getByTestId('workspace-delete-confirm-input').fill('Personal');
    await expect(confirmBtn).toBeEnabled();
    await confirmBtn.click();

    // The Personal workspace should be gone.
    await expect(personalRow).toHaveCount(0);
  });
});

test.describe('Workspaces — switcher dropdown', () => {
  test('opens from the sidebar footer and lists every workspace', async ({
    optionsPage,
    extensionId,
  }) => {
    await goToOptionsPage(optionsPage, extensionId);
    await optionsPage.getByTestId('workspace-footer-trigger').click();
    const dropdown = optionsPage.getByTestId('workspace-switcher-content');
    await expect(dropdown).toBeVisible();
    await expect(optionsPage.getByTestId('workspace-switcher-item-default')).toBeVisible();
    await expect(optionsPage.getByTestId('workspace-switcher-manage')).toBeVisible();
  });
});
