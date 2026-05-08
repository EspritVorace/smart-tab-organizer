/**
 * E2E tests for the search and highlight features on the Workspaces page,
 * plus the page-level keyboard shortcuts wired to the new ListToolbar:
 * `/` focuses the search field, `Esc` clears it, `n` opens the create dialog.
 */
import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';

async function goToWorkspaces(page: Page, extensionId: string) {
  await page.goto(`chrome-extension://${extensionId}/options.html#workspaces`);
  await page.waitForLoadState('domcontentloaded');
  await page.getByTestId('workspace-create-button').waitFor({ state: 'visible', timeout: 10_000 });
}

async function createWorkspace(page: Page, name: string) {
  await page.getByTestId('workspace-create-button').click();
  await expect(page.getByTestId('workspace-form-dialog')).toBeVisible();
  await page.getByTestId('workspace-form-name').fill(name);
  await page.getByTestId('workspace-form-btn-submit').click();
  await expect(page.getByTestId('workspace-form-dialog')).toBeHidden();
  await expect(page.locator('[data-testid^="workspace-row-"]', { hasText: name })).toBeVisible();
}

test.describe('Workspaces search filter', () => {
  test('typing filters the list and matches by name', async ({ optionsPage, extensionId }) => {
    await goToWorkspaces(optionsPage, extensionId);
    await createWorkspace(optionsPage, 'Personal');
    await createWorkspace(optionsPage, 'Work');

    const search = optionsPage.getByTestId('page-workspaces-search');
    await search.fill('Work');

    await expect(optionsPage.locator('[data-testid^="workspace-row-"]', { hasText: 'Work' })).toBeVisible();
    await expect(optionsPage.locator('[data-testid^="workspace-row-"]', { hasText: 'Personal' })).toHaveCount(0);
  });

  test('search is case and accent insensitive', async ({ optionsPage, extensionId }) => {
    await goToWorkspaces(optionsPage, extensionId);
    await createWorkspace(optionsPage, 'Café');

    const search = optionsPage.getByTestId('page-workspaces-search');
    await search.fill('cafe');

    await expect(optionsPage.locator('[data-testid^="workspace-row-"]', { hasText: 'Café' })).toBeVisible();
  });

  test('clearing search restores all workspaces', async ({ optionsPage, extensionId }) => {
    await goToWorkspaces(optionsPage, extensionId);
    await createWorkspace(optionsPage, 'Alpha');
    await createWorkspace(optionsPage, 'Beta');

    const search = optionsPage.getByTestId('page-workspaces-search');
    await search.fill('Alpha');
    await expect(optionsPage.locator('[data-testid^="workspace-row-"]', { hasText: 'Beta' })).toHaveCount(0);

    await search.fill('');
    await expect(optionsPage.locator('[data-testid^="workspace-row-"]', { hasText: 'Alpha' })).toBeVisible();
    await expect(optionsPage.locator('[data-testid^="workspace-row-"]', { hasText: 'Beta' })).toBeVisible();
  });

  test('shows no-results empty state and keeps the create button visible', async ({
    optionsPage,
    extensionId,
  }) => {
    await goToWorkspaces(optionsPage, extensionId);

    const search = optionsPage.getByTestId('page-workspaces-search');
    await search.fill('zzz-no-such-workspace-xyz');

    await expect(optionsPage.getByText(/no workspaces found/i)).toBeVisible();
    await expect(optionsPage.getByTestId('workspace-create-button')).toBeVisible();
    await expect(optionsPage.locator('[data-testid^="workspace-row-"]')).toHaveCount(0);
  });
});

test.describe('Workspaces search highlight', () => {
  test('matching part of the workspace name is wrapped in a <mark>', async ({
    optionsPage,
    extensionId,
  }) => {
    await goToWorkspaces(optionsPage, extensionId);
    await createWorkspace(optionsPage, 'Personal Hub');

    const search = optionsPage.getByTestId('page-workspaces-search');
    await search.fill('Personal');

    await expect(optionsPage.locator('mark').filter({ hasText: 'Personal' }).first()).toBeVisible();
  });

  test('no highlight when the search field is empty', async ({ optionsPage, extensionId }) => {
    await goToWorkspaces(optionsPage, extensionId);
    await createWorkspace(optionsPage, 'Sandbox');

    await expect(optionsPage.locator('mark')).toHaveCount(0);
  });
});

test.describe('Workspaces keyboard shortcuts', () => {
  test('"/" focuses the search field', async ({ optionsPage, extensionId }) => {
    await goToWorkspaces(optionsPage, extensionId);

    await optionsPage.locator('body').click();
    await optionsPage.keyboard.press('/');

    const search = optionsPage.getByTestId('page-workspaces-search');
    await expect(search).toBeFocused();
  });

  test('"Esc" clears the search input', async ({ optionsPage, extensionId }) => {
    await goToWorkspaces(optionsPage, extensionId);

    const search = optionsPage.getByTestId('page-workspaces-search');
    await search.fill('something');
    await expect(search).toHaveValue('something');

    await search.press('Escape');
    await expect(search).toHaveValue('');
  });

  test('"n" opens the create workspace dialog', async ({ optionsPage, extensionId }) => {
    await goToWorkspaces(optionsPage, extensionId);

    await optionsPage.locator('body').click();
    await optionsPage.keyboard.press('n');

    await expect(optionsPage.getByTestId('workspace-form-dialog')).toBeVisible();
  });
});
