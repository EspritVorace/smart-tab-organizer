/**
 * E2E tests for the Rule Wizard (creation) and Edit Summary View (edit mode).
 * Covers: step navigation, per-step validation, mode switching, summary,
 * edit mode identity/config/options, keyboard navigation.
 *
 * Migrated to the Page Object / Domain Action architecture (lot 5):
 * `RuleWizardPage` from `e2e-shared/pages/` replaces the inline locators
 * and the local `openCreateWizard` / `goToStep2` helpers.
 */
import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';
import { goToDomainRulesSection } from './helpers/navigation';
import { auditPage } from './helpers/a11y';
import { RuleWizardPage } from '../../e2e-shared/pages/index.js';
import { openRuleWizard } from '../../e2e-shared/actions/index.js';

test.beforeEach(async ({ helpers }) => {
  await helpers.clearDomainRules();
});

// ─── Local fixtures ────────────────────────────────────────────────────────

/** Open the "Add Rule" wizard from the Domain Rules section. */
async function openCreateWizard(page: Page, extensionId: string): Promise<RuleWizardPage> {
  await goToDomainRulesSection(page, extensionId);
  return openRuleWizard(page);
}

/** Fill step 1 with valid unique data and advance to step 2. */
async function advanceToStep2(wizard: RuleWizardPage): Promise<void> {
  await wizard.fillLabel('My New Rule');
  await wizard.fillDomainFilter('mynew.com');
  await wizard.clickNext();
  await wizard.expectOnStep(2);
}

// ---------------------------------------------------------------------------
// Creation — Step 1: Identity
// ---------------------------------------------------------------------------
test.describe('Creation wizard — Step 1: Identity', () => {
  test('wizard dialog opens at step 1 on "Add Rule" click', async ({
    extensionContext, extensionId,
  }) => {
    const page = await extensionContext.newPage();
    const wizard = await openCreateWizard(page, extensionId);

    await wizard.expectVisible();
    await expect(wizard.labelInput()).toBeVisible();
    await expect(wizard.domainFilterInput()).toBeVisible();
    await expect(wizard.stepper()).toBeVisible();
    await auditPage(page, 'rule-wizard-step-1-identity', { include: '[role="dialog"]' });
    await page.close();
  });

  test('step 1 — Next is blocked when fields are empty', async ({
    extensionContext, extensionId,
  }) => {
    const page = await extensionContext.newPage();
    const wizard = await openCreateWizard(page, extensionId);

    // Click Next without filling anything: label is empty (and so is the
    // auto-derived value from an empty domain), so validation must block.
    await wizard.clickNext();

    // Still on step 1.
    await expect(wizard.labelInput()).toBeVisible();
    await page.close();
  });

  test('step 1 — label is auto-derived from the domain filter', async ({
    extensionContext, extensionId,
  }) => {
    const page = await extensionContext.newPage();
    const wizard = await openCreateWizard(page, extensionId);

    await wizard.fillDomainFilter('mail.google.com');
    await expect(wizard.labelInput()).toHaveValue('Google');

    // Once the user owns the label, further domain edits do not overwrite it.
    await wizard.fillLabel('Custom Label');
    await wizard.fillDomainFilter('atlassian.net');
    await expect(wizard.labelInput()).toHaveValue('Custom Label');
    await page.close();
  });

  test('step 1 — category radiogroup is visible and selection persists across steps', async ({
    extensionContext, extensionId,
  }) => {
    const page = await extensionContext.newPage();
    const wizard = await openCreateWizard(page, extensionId);

    await expect(wizard.categoryField()).toBeVisible();
    await wizard.selectCategory('Development');
    const developmentRadio = wizard.categoryField().getByTestId('wizard-rule-category-development');
    await expect(developmentRadio).toHaveAttribute('aria-checked', 'true');

    await wizard.fillLabel('Cat Rule');
    await wizard.fillDomainFilter('catrule.com');
    await wizard.clickNext();
    await wizard.expectOnStep(2);

    await wizard.clickBack();
    await expect(wizard.categoryField().getByTestId('wizard-rule-category-development'))
      .toHaveAttribute('aria-checked', 'true');
    await page.close();
  });

  test('step 1 — category radiogroup supports arrow-key navigation', async ({
    extensionContext, extensionId,
  }) => {
    const page = await extensionContext.newPage();
    const wizard = await openCreateWizard(page, extensionId);

    const noneSwatch = wizard.categoryField().getByTestId('wizard-rule-category-none');
    await noneSwatch.focus();
    await expect(noneSwatch).toBeFocused();
    await expect(noneSwatch).toHaveAttribute('aria-checked', 'true');

    // Selection-follows-focus: ArrowRight selects the next swatch (the first
    // built-in category by registry order).
    await page.keyboard.press('ArrowRight');
    const checkedAfterArrow = wizard.categoryField().getByRole('radio', { checked: true });
    await expect(checkedAfterArrow).not.toHaveAttribute('data-testid', 'wizard-rule-category-none');

    // Home key cycles back to the first swatch (None).
    await page.keyboard.press('Home');
    await expect(noneSwatch).toBeFocused();
    await expect(noneSwatch).toHaveAttribute('aria-checked', 'true');
    await page.close();
  });

  test('step 1 — Next is blocked when domainFilter is invalid', async ({
    extensionContext, extensionId,
  }) => {
    const page = await extensionContext.newPage();
    const wizard = await openCreateWizard(page, extensionId);

    await wizard.fillLabel('Test');
    await wizard.fillDomainFilter('not a domain!!!');
    await wizard.clickNext();

    await expect(wizard.labelInput()).toBeVisible();
    await page.close();
  });

  test('step 1 — Next is blocked when label already exists', async ({
    extensionContext, extensionId, helpers,
  }) => {
    await helpers.addDomainRule({ label: 'Existing', domainFilter: 'existing.com' });

    const page = await extensionContext.newPage();
    const wizard = await openCreateWizard(page, extensionId);

    await wizard.fillLabel('existing'); // case-insensitive duplicate
    await wizard.fillDomainFilter('new.com');
    await wizard.clickNext();

    await expect(wizard.labelInput()).toBeVisible();
    await page.close();
  });

  test('step 1 — valid data advances to step 2', async ({
    extensionContext, extensionId,
  }) => {
    const page = await extensionContext.newPage();
    const wizard = await openCreateWizard(page, extensionId);

    await wizard.fillLabel('Valid Rule');
    await wizard.fillDomainFilter('valid.com');
    await wizard.clickNext();

    await wizard.expectOnStep(2);
    await page.close();
  });

  test('step 1 — no Previous button visible', async ({
    extensionContext, extensionId,
  }) => {
    const page = await extensionContext.newPage();
    const wizard = await openCreateWizard(page, extensionId);

    await expect(wizard.backButton()).not.toBeAttached();
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
    const wizard = await openCreateWizard(page, extensionId);
    await advanceToStep2(wizard);

    await expect(wizard.presetTrigger()).toBeVisible();
    await auditPage(page, 'rule-wizard-step-2-configuration', { include: '[role="dialog"]' });
    await page.close();
  });

  test('step 2 — Ask mode shows explanatory text, no regex fields', async ({
    extensionContext, extensionId,
  }) => {
    const page = await extensionContext.newPage();
    const wizard = await openCreateWizard(page, extensionId);
    await advanceToStep2(wizard);

    await wizard.selectConfigMode('ask');
    await expect(wizard.configModeRadio('ask')).toHaveAttribute('data-state', 'checked');

    await expect(wizard.dialog().getByTestId('config-mode-description')).toBeVisible();
    await expect(wizard.dialog().locator('input[name="titleParsingRegEx"]')).not.toBeAttached();
    await expect(wizard.dialog().locator('input[name="urlParsingRegEx"]')).not.toBeAttached();
    await page.close();
  });

  test('step 2 — Manual mode shows groupNameSource select', async ({
    extensionContext, extensionId,
  }) => {
    const page = await extensionContext.newPage();
    const wizard = await openCreateWizard(page, extensionId);
    await advanceToStep2(wizard);

    await wizard.selectConfigMode('manual');
    await expect(wizard.dialog().locator('.rt-SelectTrigger')).toBeVisible();
    await page.close();
  });

  test('step 2 — Previous returns to step 1 preserving values', async ({
    extensionContext, extensionId,
  }) => {
    const page = await extensionContext.newPage();
    const wizard = await openCreateWizard(page, extensionId);
    await wizard.fillLabel('Preserved Label');
    await wizard.fillDomainFilter('preserved.com');
    await wizard.clickNext();
    await wizard.expectOnStep(2);

    await wizard.clickBack();

    await expect(wizard.labelInput()).toHaveValue('Preserved Label');
    await expect(wizard.domainFilterInput()).toHaveValue('preserved.com');
    await page.close();
  });
});

// ---------------------------------------------------------------------------
// Creation — Step 3: Options
// ---------------------------------------------------------------------------
test.describe('Creation wizard — Step 3: Options', () => {
  async function advanceToStep3(wizard: RuleWizardPage): Promise<void> {
    await advanceToStep2(wizard);
    await wizard.clickNext();
    await wizard.deduplicationSwitch().waitFor({ state: 'visible' });
  }

  test('step 3 — dedup switch visible and enabled by default', async ({
    extensionContext, extensionId,
  }) => {
    const page = await extensionContext.newPage();
    const wizard = await openCreateWizard(page, extensionId);
    await advanceToStep3(wizard);

    await expect(wizard.deduplicationSwitch()).toBeVisible();
    await expect(wizard.deduplicationSwitch()).toHaveAttribute('data-state', 'checked');
    await auditPage(page, 'rule-wizard-step-3-options', { include: '[role="dialog"]' });
    await page.close();
  });

  test('step 3 — disabling dedup hides RadioGroup', async ({
    extensionContext, extensionId,
  }) => {
    const page = await extensionContext.newPage();
    const wizard = await openCreateWizard(page, extensionId);
    await advanceToStep3(wizard);

    await wizard.setDeduplicationEnabled(false);
    await expect(wizard.deduplicationMatchModeGroup()).not.toBeAttached();
    await page.close();
  });

  test('step 3 — Previous returns to step 2', async ({
    extensionContext, extensionId,
  }) => {
    const page = await extensionContext.newPage();
    const wizard = await openCreateWizard(page, extensionId);
    await advanceToStep3(wizard);

    await wizard.clickBack();
    await wizard.expectOnStep(2);
    await page.close();
  });

  test('step 3 — Next always advances (no blocking validation)', async ({
    extensionContext, extensionId,
  }) => {
    const page = await extensionContext.newPage();
    const wizard = await openCreateWizard(page, extensionId);
    await advanceToStep3(wizard);

    await wizard.clickNext();
    await expect(wizard.createButton()).toBeVisible();
    await page.close();
  });
});

// ---------------------------------------------------------------------------
// Creation — Step 4: Summary
// ---------------------------------------------------------------------------
test.describe('Creation wizard — Step 4: Summary', () => {
  async function advanceToStep4(wizard: RuleWizardPage): Promise<void> {
    await advanceToStep2(wizard);
    await wizard.clickNext(); // step 3
    await wizard.deduplicationSwitch().waitFor({ state: 'visible' });
    await wizard.clickNext(); // step 4
    await wizard.createButton().waitFor({ state: 'visible' });
  }

  test('step 4 — shows summary sections', async ({
    extensionContext, extensionId,
  }) => {
    const page = await extensionContext.newPage();
    const wizard = await openCreateWizard(page, extensionId);
    await advanceToStep4(wizard);

    await expect(wizard.dialog().getByRole('button', { name: /modify/i })).toHaveCount(3);
    await auditPage(page, 'rule-wizard-step-4-summary', { include: '[role="dialog"]' });
    await page.close();
  });

  test('step 4 — Modify button in first section goes to step 1', async ({
    extensionContext, extensionId,
  }) => {
    const page = await extensionContext.newPage();
    const wizard = await openCreateWizard(page, extensionId);
    await advanceToStep4(wizard);

    await wizard.clickModifySection(0);
    await expect(wizard.labelInput()).toBeVisible();
    await page.close();
  });

  test('step 4 — Create button creates rule and closes modal', async ({
    extensionContext, extensionId,
  }) => {
    const page = await extensionContext.newPage();
    const wizard = await openCreateWizard(page, extensionId);
    await wizard.fillLabel('Brand New Rule');
    await wizard.fillDomainFilter('brandnew.com');
    await wizard.clickNext();
    // Switch to Ask mode so no preset is required.
    await wizard.selectConfigMode('ask');
    await wizard.clickNext();
    await wizard.deduplicationSwitch().waitFor({ state: 'visible' });
    await wizard.clickNext();
    await wizard.createButton().waitFor({ state: 'visible' });

    await wizard.clickCreate();

    await wizard.expectHidden();
    await expect(page.getByRole('listitem', { name: /Brand New Rule/i })).toBeVisible();
    await page.close();
  });
});

// ---------------------------------------------------------------------------
// Edit mode
// ---------------------------------------------------------------------------
test.describe('Edit mode — Summary View', () => {
  /** Open the edit wizard for a rule identified by its label (looked up in the listitem). */
  async function openEditByLabel(page: Page, label: string | RegExp): Promise<RuleWizardPage> {
    const labelRe = label instanceof RegExp ? label : new RegExp(label, 'i');
    await page.getByRole('listitem', { name: labelRe }).getByLabel('More actions').click();
    await page.getByRole('menuitem', { name: /edit/i }).click();
    const wizard = new RuleWizardPage(page);
    await wizard.expectVisible();
    return wizard;
  }

  test('edit opens on summary view (no wizard stepper, no inline fields)', async ({
    extensionContext, extensionId, helpers,
  }) => {
    await helpers.addDomainRule({ label: 'Edit Me', domainFilter: 'edit.com' });

    const page = await extensionContext.newPage();
    await goToDomainRulesSection(page, extensionId);
    const wizard = await openEditByLabel(page, 'Edit Me');

    await expect(wizard.stepper()).not.toBeAttached();
    await expect(wizard.editSummary()).toBeVisible();
    await expect(wizard.labelInput()).not.toBeAttached();
    await expect(wizard.domainFilterInput()).not.toBeAttached();
    await expect(wizard.dialog().getByRole('button', { name: /modify/i })).toHaveCount(3);
    await page.close();
  });

  test('edit — identity modal updates label and Save persists', async ({
    extensionContext, extensionId, helpers,
  }) => {
    await helpers.addDomainRule({ label: 'Rename Me', domainFilter: 'rename.com' });

    const page = await extensionContext.newPage();
    await goToDomainRulesSection(page, extensionId);
    const wizard = await openEditByLabel(page, 'Rename Me');

    await wizard.clickModifySection(0);
    const identityModal = page.getByTestId('modal-edit-identity');
    await expect(identityModal).toBeVisible();

    await identityModal.getByTestId('modal-edit-identity-field-label').fill('Renamed Rule');
    await identityModal.getByTestId('modal-edit-identity-btn-apply').click();
    await expect(identityModal).toBeHidden();

    await wizard.clickSave();
    await wizard.expectHidden();
    await expect(page.getByRole('listitem', { name: /Renamed Rule/i })).toBeVisible();
    await page.close();
  });

  test('edit — Modify button on Configuration section opens the config modal', async ({
    extensionContext, extensionId, helpers,
  }) => {
    await helpers.addDomainRule({ label: 'Config Test', domainFilter: 'config.com' });

    const page = await extensionContext.newPage();
    await goToDomainRulesSection(page, extensionId);
    const wizard = await openEditByLabel(page, 'Config Test');

    await wizard.clickModifySection(1);

    await wizard.expectVisible();
    await expect(page.getByTestId('modal-edit-config')).toBeVisible();
    await page.close();
  });

  test('edit — Modify button on Options section opens the options modal', async ({
    extensionContext, extensionId, helpers,
  }) => {
    await helpers.addDomainRule({ label: 'Options Test', domainFilter: 'options.com' });

    const page = await extensionContext.newPage();
    await goToDomainRulesSection(page, extensionId);
    const wizard = await openEditByLabel(page, 'Options Test');

    // No inline switch in the summary view.
    await expect(wizard.deduplicationSwitch()).toBeHidden();

    await wizard.clickModifySection(2);

    const optionsModal = page.getByTestId('modal-edit-options');
    await expect(optionsModal).toBeVisible();
    await expect(optionsModal.locator('[role="switch"]')).toBeVisible();
    await page.close();
  });

  test('edit — identity modal Cancel does not persist', async ({
    extensionContext, extensionId, helpers,
  }) => {
    await helpers.addDomainRule({ label: 'Keep Me', domainFilter: 'keep.com' });

    const page = await extensionContext.newPage();
    await goToDomainRulesSection(page, extensionId);
    const wizard = await openEditByLabel(page, 'Keep Me');

    await wizard.clickModifySection(0);
    const identityModal = page.getByTestId('modal-edit-identity');
    await identityModal.getByTestId('modal-edit-identity-field-label').fill('Discarded Label');
    await identityModal.getByRole('button', { name: /cancel/i }).click();
    await expect(identityModal).toBeHidden();

    await wizard.clickCancel();
    await expect(page.getByRole('listitem', { name: /Keep Me/i })).toBeVisible();
    await expect(page.getByRole('listitem', { name: /Discarded Label/i })).toHaveCount(0);
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
    const wizard = await openCreateWizard(page, extensionId);
    await wizard.expectVisible();

    await page.keyboard.press('Escape');

    await wizard.expectHidden();
    await page.close();
  });
});
