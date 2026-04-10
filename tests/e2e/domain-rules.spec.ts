/**
 * E2E tests for the Domain Rules page — CRUD via the "…" dropdown menu.
 * Covers: more-actions menu visibility, Edit modal, Delete confirmation.
 *
 * NOTE: The browser context is worker-scoped and shared across spec files.
 * Other tests running in parallel may seed their own rules.
 * All selectors are scoped to the specific row for the rule under test to
 * avoid strict-mode violations from unrelated rules on the page.
 */
import { test, expect } from './fixtures';
import { goToDomainRulesSection } from './helpers/navigation';

test.beforeEach(async ({ helpers }) => {
  await helpers.clearDomainRules();
});

// ---------------------------------------------------------------------------
// More-actions dropdown
// ---------------------------------------------------------------------------
test.describe('Domain rule more-actions menu', () => {
  test('shows "More actions" button for a rule', async ({ extensionContext, extensionId, helpers }) => {
    await helpers.addDomainRule({ label: 'Jira/Atlassian', domainFilter: '*.atlassian.net' });

    const page = await extensionContext.newPage();
    await goToDomainRulesSection(page, extensionId);

    await expect(
      page.getByRole('row', { name: /Jira\/Atlassian/i }).getByLabel('More actions'),
    ).toBeVisible();
    await page.close();
  });

  test('clicking "More actions" opens dropdown with Edit and Delete items', async ({
    extensionContext,
    extensionId,
    helpers,
  }) => {
    await helpers.addDomainRule({ label: 'GitHub', domainFilter: '*.github.com' });

    const page = await extensionContext.newPage();
    await goToDomainRulesSection(page, extensionId);

    await page.getByRole('row', { name: /GitHub/i }).getByLabel('More actions').click();

    await expect(page.getByRole('menuitem', { name: /edit/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /delete/i })).toBeVisible();
    await page.close();
  });

  test('dropdown does NOT contain a Rename item', async ({
    extensionContext,
    extensionId,
    helpers,
  }) => {
    await helpers.addDomainRule({ label: 'Google', domainFilter: '*.google.com' });

    const page = await extensionContext.newPage();
    await goToDomainRulesSection(page, extensionId);

    await page.getByRole('row', { name: /Google/i }).getByLabel('More actions').click();

    await expect(page.getByRole('menuitem', { name: /rename/i })).not.toBeAttached();
    await page.close();
  });

  test('each added rule has its own More actions button', async ({
    extensionContext,
    extensionId,
    helpers,
  }) => {
    await helpers.addDomainRule({ label: 'Rule A', domainFilter: '*.a.com' });
    await helpers.addDomainRule({ label: 'Rule B', domainFilter: '*.b.com' });

    const page = await extensionContext.newPage();
    await goToDomainRulesSection(page, extensionId);

    await expect(
      page.getByRole('row', { name: /Rule A/i }).getByLabel('More actions'),
    ).toBeVisible();
    await expect(
      page.getByRole('row', { name: /Rule B/i }).getByLabel('More actions'),
    ).toBeVisible();
    await page.close();
  });
});

// ---------------------------------------------------------------------------
// Edit via dropdown
// ---------------------------------------------------------------------------
test.describe('Edit rule via dropdown', () => {
  test('clicking Edit opens the Edit Rule modal', async ({
    extensionContext,
    extensionId,
    helpers,
  }) => {
    await helpers.addDomainRule({ label: 'Slack', domainFilter: '*.slack.com' });

    const page = await extensionContext.newPage();
    await goToDomainRulesSection(page, extensionId);

    await page.getByRole('row', { name: /Slack/i }).getByLabel('More actions').click();
    await page.getByRole('menuitem', { name: /edit/i }).click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Edit Rule')).toBeVisible();
    await page.close();
  });

  test('Edit modal is pre-filled with the rule data', async ({
    extensionContext,
    extensionId,
    helpers,
  }) => {
    await helpers.addDomainRule({ label: 'Notion', domainFilter: 'notion.so' });

    const page = await extensionContext.newPage();
    await goToDomainRulesSection(page, extensionId);

    await page.getByRole('row', { name: /Notion/i }).getByLabel('More actions').click();
    await page.getByRole('menuitem', { name: /edit/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    // In edit mode the identity zone has directly editable inputs (no wizard steps)
    await expect(dialog.locator('input[name="label"]')).toHaveValue('Notion');
    await expect(dialog.locator('input[name="domainFilter"]')).toHaveValue('notion.so');
    await page.close();
  });
});

// ---------------------------------------------------------------------------
// Delete via dropdown
// ---------------------------------------------------------------------------
test.describe('Delete rule via dropdown', () => {
  test('clicking Delete opens a confirmation dialog', async ({
    extensionContext,
    extensionId,
    helpers,
  }) => {
    await helpers.addDomainRule({ label: 'Linear', domainFilter: '*.linear.app' });

    const page = await extensionContext.newPage();
    await goToDomainRulesSection(page, extensionId);

    await page.getByRole('row', { name: /Linear/i }).getByLabel('More actions').click();
    await page.getByRole('menuitem', { name: /delete/i }).click();

    await expect(page.getByRole('alertdialog')).toBeVisible();
    await page.close();
  });

  test('confirming Delete removes the rule from the list', async ({
    extensionContext,
    extensionId,
    helpers,
  }) => {
    await helpers.addDomainRule({ label: 'Figma', domainFilter: '*.figma.com' });

    const page = await extensionContext.newPage();
    await goToDomainRulesSection(page, extensionId);

    await page.getByRole('row', { name: /Figma/i }).getByLabel('More actions').click();
    await page.getByRole('menuitem', { name: /delete/i }).click();
    // Click the red "Delete" confirm button
    await page.getByRole('button', { name: /delete/i }).last().click();

    await expect(page.getByRole('row', { name: /Figma/i })).not.toBeAttached();
    await page.close();
  });

  test('cancelling Delete keeps the rule in the list', async ({
    extensionContext,
    extensionId,
    helpers,
  }) => {
    await helpers.addDomainRule({ label: 'Vercel', domainFilter: '*.vercel.app' });

    const page = await extensionContext.newPage();
    await goToDomainRulesSection(page, extensionId);

    // Wait for the rule to be rendered before interacting
    await expect(page.getByRole('row', { name: /Vercel/i })).toBeVisible({ timeout: 5000 });

    await page.getByRole('row', { name: /Vercel/i }).getByLabel('More actions').click();
    await page.getByRole('menuitem', { name: /delete/i }).click();

    // Confirm dialog is open before cancelling
    await expect(page.getByTestId('confirm-dialog')).toBeVisible();
    await page.getByRole('button', { name: /cancel/i }).click();
    await expect(page.getByTestId('confirm-dialog')).not.toBeAttached();

    await expect(
      page.getByRole('row', { name: /Vercel/i }).getByLabel('More actions'),
    ).toBeVisible();
    await page.close();
  });
});
