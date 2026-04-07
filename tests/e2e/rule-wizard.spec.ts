/**
 * E2E tests for the Rule Wizard (creation) and Edit Summary View (edit mode).
 * Covers: step navigation, per-step validation, mode switching, summary,
 * edit mode identity/config/options, keyboard navigation.
 *
 * Tests use `test.beforeEach` to clear domain rules and start from a clean state.
 */
import { test, expect } from './fixtures';
import { goToDomainRulesSection } from './helpers/navigation';

test.beforeEach(async ({ helpers }) => {
  await helpers.clearDomainRules();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Open the "Add Rule" wizard dialog from the Domain Rules section. */
async function openCreateWizard(page: import('@playwright/test').Page, extensionId: string) {
  await goToDomainRulesSection(page, extensionId);
  await page.getByTestId('page-rules-btn-add').click();
  await page.waitForTimeout(300);
  return page.getByTestId('wizard-rule');
}

/** Fill step 1 with valid unique data and click Next to reach step 2. */
async function goToStep2(dialog: import('@playwright/test').Locator) {
  await dialog.getByTestId('wizard-rule-field-label').fill('My New Rule');
  await dialog.getByTestId('wizard-rule-field-domain').fill('mynew.com');
  await dialog.getByRole('button', { name: /next/i }).click();
  await dialog.getByTestId('wizard-rule-step-2').waitFor({ state: 'visible' });
}

// ---------------------------------------------------------------------------
// Creation — Step 1: Identity
// ---------------------------------------------------------------------------
test.describe('Creation wizard — Step 1: Identity', () => {
  test('wizard dialog opens at step 1 on "Add Rule" click', async ({
    extensionContext, extensionId,
  }) => {
    const page = await extensionContext.newPage();
    const dialog = await openCreateWizard(page, extensionId);

    await expect(dialog).toBeVisible();
    // Step 1 inputs present
    await expect(dialog.getByTestId('wizard-rule-field-label')).toBeVisible();
    await expect(dialog.getByTestId('wizard-rule-field-domain')).toBeVisible();
    // WizardStepper visible with 4 steps
    await expect(dialog.getByTestId('wizard-rule-stepper')).toBeVisible();
    await page.close();
  });

  test('step 1 — Next is blocked when label is empty', async ({
    extensionContext, extensionId,
  }) => {
    const page = await extensionContext.newPage();
    const dialog = await openCreateWizard(page, extensionId);

    // Fill domain but leave label empty
    await dialog.getByTestId('wizard-rule-field-domain').fill('test.com');
    await dialog.getByRole('button', { name: /next/i }).click();
    await page.waitForTimeout(200);

    // Still on step 1 (label input still visible)
    await expect(dialog.getByTestId('wizard-rule-field-label')).toBeVisible();
    await page.close();
  });

  test('step 1 — Next is blocked when domainFilter is invalid', async ({
    extensionContext, extensionId,
  }) => {
    const page = await extensionContext.newPage();
    const dialog = await openCreateWizard(page, extensionId);

    await dialog.getByTestId('wizard-rule-field-label').fill('Test');
    await dialog.getByTestId('wizard-rule-field-domain').fill('not a domain!!!');
    await dialog.getByRole('button', { name: /next/i }).click();
    await page.waitForTimeout(200);

    // Still on step 1
    await expect(dialog.getByTestId('wizard-rule-field-label')).toBeVisible();
    await page.close();
  });

  test('step 1 — Next is blocked when label already exists', async ({
    extensionContext, extensionId, helpers,
  }) => {
    await helpers.addDomainRule({ label: 'Existing', domainFilter: 'existing.com' });

    const page = await extensionContext.newPage();
    const dialog = await openCreateWizard(page, extensionId);

    await dialog.getByTestId('wizard-rule-field-label').fill('existing'); // case-insensitive duplicate
    await dialog.getByTestId('wizard-rule-field-domain').fill('new.com');
    await dialog.getByRole('button', { name: /next/i }).click();
    await page.waitForTimeout(200);

    // Still on step 1
    await expect(dialog.getByTestId('wizard-rule-field-label')).toBeVisible();
    await page.close();
  });

  test('step 1 — valid data advances to step 2', async ({
    extensionContext, extensionId,
  }) => {
    const page = await extensionContext.newPage();
    const dialog = await openCreateWizard(page, extensionId);

    await dialog.getByTestId('wizard-rule-field-label').fill('Valid Rule');
    await dialog.getByTestId('wizard-rule-field-domain').fill('valid.com');
    await dialog.getByRole('button', { name: /next/i }).click();
    await page.waitForTimeout(300);

    // Config mode selector is visible at step 2
    await expect(dialog.getByTestId('wizard-rule-step-2')).toBeVisible();
    await page.close();
  });

  test('step 1 — no Previous button visible', async ({
    extensionContext, extensionId,
  }) => {
    const page = await extensionContext.newPage();
    const dialog = await openCreateWizard(page, extensionId);

    await expect(dialog.getByRole('button', { name: /previous/i })).not.toBeAttached();
    await page.close();
  });
});

// ---------------------------------------------------------------------------
// Creation — Step 2: Configuration
// ---------------------------------------------------------------------------
test.describe('Creation wizard — Step 2: Configuration', () => {
  test('step 2 — Preset mode shows SearchableSelect', async ({
    extensionContext, extensionId,
  }) => {
    const page = await extensionContext.newPage();
    const dialog = await openCreateWizard(page, extensionId);
    await goToStep2(dialog);

    // Preset is the default mode — SearchableSelect button should be present
    // (it renders a trigger button with the placeholder text)
    const presetTrigger = dialog.locator('#presetId');
    await expect(presetTrigger).toBeVisible();
    await page.close();
  });

  test('step 2 — Ask mode shows explanatory text, no regex fields', async ({
    extensionContext, extensionId,
  }) => {
    const page = await extensionContext.newPage();
    const dialog = await openCreateWizard(page, extensionId);
    await goToStep2(dialog);

    // Click Ask segment
    await dialog.getByTestId('config-mode-ask').click();
    await page.waitForTimeout(200);

    // Explanatory text in a Callout
    await expect(dialog.locator('.rt-CalloutText')).toBeVisible();
    // No regex input fields
    await expect(dialog.locator('input[name="titleParsingRegEx"]')).not.toBeAttached();
    await expect(dialog.locator('input[name="urlParsingRegEx"]')).not.toBeAttached();
    await page.close();
  });

  test('step 2 — Manual mode shows groupNameSource select', async ({
    extensionContext, extensionId,
  }) => {
    const page = await extensionContext.newPage();
    const dialog = await openCreateWizard(page, extensionId);
    await goToStep2(dialog);

    // Click Manual segment
    await dialog.getByTestId('config-mode-manual').click();
    await page.waitForTimeout(200);

    // Group name source select trigger visible
    const selectTrigger = dialog.locator('.rt-SelectTrigger');
    await expect(selectTrigger).toBeVisible();
    await page.close();
  });

  test('step 2 — Previous returns to step 1 preserving values', async ({
    extensionContext, extensionId,
  }) => {
    const page = await extensionContext.newPage();
    const dialog = await openCreateWizard(page, extensionId);
    await dialog.getByTestId('wizard-rule-field-label').fill('Preserved Label');
    await dialog.getByTestId('wizard-rule-field-domain').fill('preserved.com');
    await dialog.getByRole('button', { name: /next/i }).click();
    await page.waitForTimeout(300);

    await dialog.getByRole('button', { name: /previous/i }).click();
    await page.waitForTimeout(200);

    await expect(dialog.getByTestId('wizard-rule-field-label')).toHaveValue('Preserved Label');
    await expect(dialog.getByTestId('wizard-rule-field-domain')).toHaveValue('preserved.com');
    await page.close();
  });
});

// ---------------------------------------------------------------------------
// Creation — Step 3: Options
// ---------------------------------------------------------------------------
test.describe('Creation wizard — Step 3: Options', () => {
  async function goToStep3(dialog: import('@playwright/test').Locator) {
    await goToStep2(dialog);
    await dialog.getByRole('button', { name: /next/i }).click();
    await dialog.locator('[role="switch"]').waitFor({ state: 'visible' });
  }

  test('step 3 — dedup switch visible and enabled by default', async ({
    extensionContext, extensionId,
  }) => {
    const page = await extensionContext.newPage();
    const dialog = await openCreateWizard(page, extensionId);
    await goToStep3(dialog);

    const switchEl = dialog.locator('[role="switch"]');
    await expect(switchEl).toBeVisible();
    // Switch is checked (dedup enabled by default)
    await expect(switchEl).toHaveAttribute('data-state', 'checked');
    await page.close();
  });

  test('step 3 — disabling dedup hides RadioGroup', async ({
    extensionContext, extensionId,
  }) => {
    const page = await extensionContext.newPage();
    const dialog = await openCreateWizard(page, extensionId);
    await goToStep3(dialog);

    // Click switch to disable dedup
    await dialog.locator('[role="switch"]').click();
    await page.waitForTimeout(200);

    // RadioGroup not visible
    await expect(dialog.locator('[role="radiogroup"]')).not.toBeAttached();
    await page.close();
  });

  test('step 3 — Previous returns to step 2', async ({
    extensionContext, extensionId,
  }) => {
    const page = await extensionContext.newPage();
    const dialog = await openCreateWizard(page, extensionId);
    await goToStep3(dialog);

    await dialog.getByRole('button', { name: /previous/i }).click();
    await page.waitForTimeout(200);

    // Back at step 2 — config mode selector visible
    await expect(dialog.getByTestId('wizard-rule-step-2')).toBeVisible();
    await page.close();
  });

  test('step 3 — Next always advances (no blocking validation)', async ({
    extensionContext, extensionId,
  }) => {
    const page = await extensionContext.newPage();
    const dialog = await openCreateWizard(page, extensionId);
    await goToStep3(dialog);

    await dialog.getByRole('button', { name: /next/i }).click();
    await page.waitForTimeout(300);

    // Step 4: "Create" button visible
    await expect(dialog.getByRole('button', { name: /create/i })).toBeVisible();
    await page.close();
  });
});

// ---------------------------------------------------------------------------
// Creation — Step 4: Summary
// ---------------------------------------------------------------------------
test.describe('Creation wizard — Step 4: Summary', () => {
  async function goToStep4(dialog: import('@playwright/test').Locator) {
    await goToStep2(dialog);
    await dialog.getByRole('button', { name: /next/i }).click(); // step 3
    await dialog.locator('[role="switch"]').waitFor({ state: 'visible' });
    await dialog.getByRole('button', { name: /next/i }).click(); // step 4
    await dialog.getByRole('button', { name: /create/i }).waitFor({ state: 'visible' });
  }

  test('step 4 — shows summary sections', async ({
    extensionContext, extensionId,
  }) => {
    const page = await extensionContext.newPage();
    const dialog = await openCreateWizard(page, extensionId);
    await goToStep4(dialog);

    // Three "Modify" buttons (one per section)
    const modifyButtons = dialog.getByRole('button', { name: /modify/i });
    await expect(modifyButtons).toHaveCount(3);
    await page.close();
  });

  test('step 4 — Modify button in first section goes to step 1', async ({
    extensionContext, extensionId,
  }) => {
    const page = await extensionContext.newPage();
    const dialog = await openCreateWizard(page, extensionId);
    await goToStep4(dialog);

    // Click first Modify button (Identity section)
    await dialog.getByRole('button', { name: /modify/i }).first().click();
    await page.waitForTimeout(200);

    // Back at step 1 — label input visible
    await expect(dialog.locator('input[name="label"]')).toBeVisible();
    await page.close();
  });

  test('step 4 — Create button creates rule and closes modal', async ({
    extensionContext, extensionId,
  }) => {
    const page = await extensionContext.newPage();
    const dialog = await openCreateWizard(page, extensionId);
    // Navigate through all steps to step 4 then in Ask mode (no preset required)
    await dialog.locator('input[name="label"]').fill('Brand New Rule');
    await dialog.locator('input[name="domainFilter"]').fill('brandnew.com');
    await dialog.getByRole('button', { name: /next/i }).click();
    await page.waitForTimeout(300);
    // Switch to Ask mode so no preset is required
    await dialog.getByTestId('config-mode-ask').click();
    await dialog.getByRole('button', { name: /next/i }).click();
    await dialog.locator('[role="switch"]').waitFor({ state: 'visible' });
    await dialog.getByRole('button', { name: /next/i }).click();
    await dialog.getByRole('button', { name: /create/i }).waitFor({ state: 'visible' });

    await dialog.getByRole('button', { name: /create/i }).click();
    await page.waitForTimeout(400);

    // Dialog closed
    await expect(dialog).not.toBeVisible();
    // Rule appears in list
    await expect(page.getByRole('row', { name: /Brand New Rule/i })).toBeVisible();
    await page.close();
  });
});

// ---------------------------------------------------------------------------
// Edit mode
// ---------------------------------------------------------------------------
test.describe('Edit mode — Summary View', () => {
  test('edit opens on summary view (no wizard stepper)', async ({
    extensionContext, extensionId, helpers,
  }) => {
    await helpers.addDomainRule({ label: 'Edit Me', domainFilter: 'edit.com' });

    const page = await extensionContext.newPage();
    await goToDomainRulesSection(page, extensionId);

    await page.getByRole('row', { name: /Edit Me/i }).getByLabel('More actions').click();
    await page.getByRole('menuitem', { name: /edit/i }).click();

    const dialog = page.getByTestId('wizard-rule');
    await expect(dialog).toBeVisible();
    // No wizard stepper
    await expect(dialog.getByTestId('wizard-rule-stepper')).not.toBeAttached();
    // Identity fields visible and editable
    await expect(dialog.getByTestId('wizard-rule-field-label')).toHaveValue('Edit Me');
    await expect(dialog.getByTestId('wizard-rule-field-domain')).toHaveValue('edit.com');
    await page.close();
  });

  test('edit — Save button saves changes', async ({
    extensionContext, extensionId, helpers,
  }) => {
    await helpers.addDomainRule({ label: 'Rename Me', domainFilter: 'rename.com' });

    const page = await extensionContext.newPage();
    await goToDomainRulesSection(page, extensionId);

    await page.getByRole('row', { name: /Rename Me/i }).getByLabel('More actions').click();
    await page.getByRole('menuitem', { name: /edit/i }).click();

    const dialog = page.getByTestId('wizard-rule');
    await dialog.getByTestId('wizard-rule-field-label').fill('Renamed Rule');
    await dialog.getByRole('button', { name: /save/i }).click();
    await page.waitForTimeout(400);

    await expect(dialog).not.toBeVisible();
    await expect(page.getByRole('row', { name: /Renamed Rule/i })).toBeVisible();
    await page.close();
  });

  test('edit — pencil button opens config modal', async ({
    extensionContext, extensionId, helpers,
  }) => {
    await helpers.addDomainRule({ label: 'Config Test', domainFilter: 'config.com' });

    const page = await extensionContext.newPage();
    await goToDomainRulesSection(page, extensionId);

    await page.getByRole('row', { name: /Config Test/i }).getByLabel('More actions').click();
    await page.getByRole('menuitem', { name: /edit/i }).click();

    const dialog = page.getByTestId('wizard-rule');
    await dialog.waitFor({ state: 'visible' });

    // Click pencil button (aria-label contains "Edit configuration" or similar)
    await dialog.getByRole('button', { name: /edit configuration/i }).click();
    await page.waitForTimeout(300);

    // A second dialog opens
    const dialogs = page.locator('[role="dialog"]');
    await expect(dialogs).toHaveCount(2);
    await page.close();
  });

  test('edit — options section is collapsed by default and expands', async ({
    extensionContext, extensionId, helpers,
  }) => {
    await helpers.addDomainRule({ label: 'Options Test', domainFilter: 'options.com' });

    const page = await extensionContext.newPage();
    await goToDomainRulesSection(page, extensionId);

    await page.getByRole('row', { name: /Options Test/i }).getByLabel('More actions').click();
    await page.getByRole('menuitem', { name: /edit/i }).click();

    const dialog = page.getByTestId('wizard-rule');
    await dialog.waitFor({ state: 'visible' });

    // Dedup switch not visible (options collapsed)
    await expect(dialog.locator('[role="switch"]')).not.toBeVisible();

    // Click the collapsible trigger to expand
    const optionsTrigger = dialog.getByRole('button', { name: /options/i });
    await optionsTrigger.click();
    await page.waitForTimeout(200);

    // Dedup switch now visible
    await expect(dialog.locator('[role="switch"]')).toBeVisible();
    await page.close();
  });
});

// ---------------------------------------------------------------------------
// Keyboard navigation
// ---------------------------------------------------------------------------
test.describe('Keyboard navigation', () => {
  test('Escape closes the wizard modal', async ({
    extensionContext, extensionId,
  }) => {
    const page = await extensionContext.newPage();
    const dialog = await openCreateWizard(page, extensionId);
    await expect(dialog).toBeVisible();

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    await expect(dialog).not.toBeVisible();
    await page.close();
  });
});
