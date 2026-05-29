/**
 * E2E tests for initial focus behaviour in dialogs (US-A11Y001).
 *
 * Rule: the close button must never receive initial focus.
 *   - Form dialogs: focus lands on the first useful input.
 *   - Wizards: focus lands on the primary action button when no input is present at step 0.
 *   - Destructive confirmations: focus lands on the Cancel button so that pressing
 *     Enter immediately never triggers the destructive action.
 */
import { test, expect } from './fixtures';
import { goToDomainRulesSection, goToSessionsSection } from './helpers/navigation';
import { seedSessions, clearSessions, createTestSession } from './helpers/seed';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns true if the currently focused element is a close button (aria-label "Close" or "Fermer"). */
async function isCloseFocused(page: import('@playwright/test').Page): Promise<boolean> {
  return page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return false;
    const label = el.getAttribute('aria-label') ?? '';
    return label.toLowerCase() === 'close' || label.toLowerCase() === 'fermer';
  });
}

// ---------------------------------------------------------------------------
// Rule creation wizard
// ---------------------------------------------------------------------------

test.describe('[US-A11Y001] Rule creation wizard', () => {
  test.beforeEach(async ({ helpers }) => {
    await helpers.clearDomainRules();
  });

  test('opening the wizard focuses the domain input, not the close button', async ({
    extensionContext,
    extensionId,
  }) => {
    const page = await extensionContext.newPage();
    await goToDomainRulesSection(page, extensionId);

    await page.getByTestId('page-rules-btn-add').click();
    await page.getByTestId('wizard-rule').waitFor({ state: 'visible' });

    // Domain filter input must have focus (label is auto-derived from it).
    await expect(page.getByTestId('wizard-rule-field-domain')).toBeFocused();
    // Close button must NOT have focus
    expect(await isCloseFocused(page)).toBe(false);

    await page.close();
  });
});

// ---------------------------------------------------------------------------
// Workspace creation dialog
// ---------------------------------------------------------------------------

test.describe('[US-A11Y001] Workspace creation dialog', () => {
  test('opening the dialog focuses the name input, not the close button', async ({
    extensionContext,
    extensionId,
  }) => {
    const page = await extensionContext.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html#workspaces`);
    await page.waitForLoadState('domcontentloaded');
    await page.getByTestId('workspace-create-button').waitFor({ state: 'visible', timeout: 10_000 });

    await page.getByTestId('workspace-create-button').click();
    await page.getByTestId('workspace-form-dialog').waitFor({ state: 'visible' });

    // Name input must have focus
    await expect(page.getByTestId('workspace-form-name')).toBeFocused();
    // Close button must NOT have focus
    expect(await isCloseFocused(page)).toBe(false);

    await page.close();
  });
});

// ---------------------------------------------------------------------------
// Rule deletion confirmation dialog
// ---------------------------------------------------------------------------

test.describe('[US-A11Y001] Rule deletion confirmation dialog', () => {
  test.beforeEach(async ({ helpers }) => {
    await helpers.clearDomainRules();
  });

  test('opening the dialog focuses Cancel so Enter does not delete', async ({
    extensionContext,
    extensionId,
    helpers,
  }) => {
    await helpers.addDomainRule({ label: 'FocusTestRule', domainFilter: '*.focustest.com' });

    const page = await extensionContext.newPage();
    await goToDomainRulesSection(page, extensionId);

    // Open the rule's dropdown and click Delete
    await page.getByRole('listitem', { name: /FocusTestRule/i }).getByLabel('More actions').click();
    await page.getByRole('menuitem', { name: /delete/i }).click();

    await page.getByTestId('confirm-dialog').waitFor({ state: 'visible' });

    // Cancel button must have focus
    await expect(page.getByTestId('confirm-dialog-btn-cancel')).toBeFocused();
    // Close button must NOT have focus
    expect(await isCloseFocused(page)).toBe(false);

    // Pressing Enter activates Cancel (closes dialog without deleting)
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('confirm-dialog')).not.toBeAttached();

    // The rule must still be present
    await expect(page.getByRole('listitem', { name: /FocusTestRule/i })).toBeVisible();

    await page.close();
  });
});

// ---------------------------------------------------------------------------
// RestoreWizard
// ---------------------------------------------------------------------------

test.describe('[US-A11Y001] RestoreWizard', () => {
  test.beforeEach(async ({ extensionContext }) => {
    await clearSessions(extensionContext);
  });

  test('opening the wizard focuses the Restore button, not the close button', async ({
    extensionContext,
    extensionId,
  }) => {
    const session = createTestSession({ name: 'Focus Test Session' });
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: /restore options/i }).click();
    await page.getByTestId('session-restore-menu-customize').click();

    await page.getByRole('dialog').waitFor({ state: 'visible' });

    // Restore button must have focus
    await expect(page.getByTestId('wizard-restore-btn-restore')).toBeFocused();
    // Close button must NOT have focus
    expect(await isCloseFocused(page)).toBe(false);

    await page.close();
  });
});
