/**
 * Composed domain actions for the Rule Wizard (creation + edit).
 *
 * Each action narrates a single business outcome ("create a rule with this
 * config", "edit an existing rule's label") and hides the wizard step
 * plumbing. Consumes `RuleWizardPage`; never reaches into raw locators.
 *
 * Callers are expected to have already navigated to the Domain Rules
 * section before invoking these helpers (this keeps the action layer
 * symmetric with `rules-import-export.ts`, which also assumes the caller
 * is already on the relevant options page).
 *
 * Shared between `tests/e2e/` (functional suite, US-R001..US-R005,
 * US-R007..US-R008) and `e2e-doc-scenarios/` (narrative captures that walk
 * the same flows for screenshots / docs).
 */
import type { Page } from '@playwright/test';
import {
  RuleWizardPage,
  type RuleWizardConfigMode,
  type RuleWizardGroupNameSource,
} from '../pages/RuleWizardPage.js';

export interface RuleWizardCreateConfig {
  /** Rule label (must be unique). */
  label: string;
  /** Domain filter (e.g. `example.com`). */
  domainFilter: string;
  /** Configuration mode (defaults to `'ask'` when omitted). */
  configMode?: RuleWizardConfigMode;
  /** Required when `configMode === 'preset'`: the preset to apply. */
  presetId?: string;
  /** Optional override for the manual mode's group-name source. */
  groupNameSource?: RuleWizardGroupNameSource;
  /** Optional deduplication toggle (default left untouched, dedup enabled). */
  deduplicationEnabled?: boolean;
  /** Optional category to assign via the picker. */
  categoryLabel?: string | null;
}

export interface RuleWizardEditPatch {
  label?: string;
  domainFilter?: string;
  configMode?: RuleWizardConfigMode;
  presetId?: string;
  groupNameSource?: RuleWizardGroupNameSource;
  deduplicationEnabled?: boolean;
}

/**
 * Open the rule creation wizard from the Domain Rules options page.
 * Returns the `RuleWizardPage` instance so callers can interact with the
 * open dialog without re-instantiating it.
 *
 * Relevant US: US-R001 (wizard entry point).
 */
export async function openRuleWizard(page: Page): Promise<RuleWizardPage> {
  await page.getByTestId('page-rules-btn-add').click();
  const wizard = new RuleWizardPage(page);
  await wizard.expectVisible({ timeout: 5000 });
  return wizard;
}

/**
 * Open the rule edit wizard for an existing rule, identified by its id.
 * The wizard lands directly on the summary view (no stepper).
 *
 * Relevant US: US-R004 (edit entry point).
 */
export async function openEditRuleWizard(
  page: Page,
  ruleId: string,
): Promise<RuleWizardPage> {
  await page.getByTestId(`rule-card-${ruleId}-btn-dropdown`).click();
  await page.getByTestId(`rule-card-${ruleId}-menu-edit`).click();
  const wizard = new RuleWizardPage(page);
  await wizard.expectVisible({ timeout: 5000 });
  await wizard.expectInEditMode(ruleId);
  return wizard;
}

/**
 * End-to-end "create a rule with this config" flow.
 *
 * Walks every step of the wizard, applying the supplied configuration, and
 * closes the dialog by clicking "Create" on the summary step. The default
 * `configMode` is `'ask'` because it is the only mode that doesn't require
 * an extra preset / regex input on step 2.
 *
 * Relevant US: US-R001 (creation flow), US-R002 (step validation).
 */
export async function createRuleViaWizard(
  page: Page,
  config: RuleWizardCreateConfig,
): Promise<void> {
  const wizard = await openRuleWizard(page);

  // Step 1: identity.
  await wizard.fillLabel(config.label);
  await wizard.fillDomainFilter(config.domainFilter);
  if (config.categoryLabel !== undefined) {
    await wizard.selectCategory(config.categoryLabel);
  }
  await wizard.clickNext();
  await wizard.expectOnStep(2);

  // Step 2: configuration.
  const mode: RuleWizardConfigMode = config.configMode ?? 'ask';
  await wizard.selectConfigMode(mode);
  if (mode === 'preset' && config.presetId) {
    await wizard.selectPreset(config.presetId);
  } else if (mode === 'manual' && config.groupNameSource) {
    await wizard.setGroupNameSource(config.groupNameSource);
  }
  await wizard.clickNext();
  await wizard.expectOnStep(3);

  // Step 3: options.
  if (config.deduplicationEnabled !== undefined) {
    await wizard.setDeduplicationEnabled(config.deduplicationEnabled);
  }
  await wizard.clickNext();
  await wizard.expectOnStep(4);

  // Step 4: summary -> create.
  await wizard.clickCreate();
  await wizard.expectHidden();
}

/**
 * End-to-end "edit an existing rule" flow.
 *
 * Opens the edit summary, opens the matching sub-dialog for each changed
 * field (`IdentityEditModal` / `ConfigEditModal` / `OptionsEditModal`),
 * applies the patch and saves the parent dialog. Callers may pass any
 * subset of the patch keys; untouched sections are left as-is.
 *
 * Relevant US: US-R004 (edit flow), US-R005 (per-section sub-dialogs).
 */
export async function editRule(
  page: Page,
  ruleId: string,
  patch: RuleWizardEditPatch,
): Promise<void> {
  const wizard = await openEditRuleWizard(page, ruleId);

  if (patch.label !== undefined || patch.domainFilter !== undefined) {
    await wizard.clickModifySection(0);
    const modal = page.getByTestId('modal-edit-identity');
    if (patch.label !== undefined) {
      await modal.getByTestId('modal-edit-identity-field-label').fill(patch.label);
    }
    if (patch.domainFilter !== undefined) {
      await modal.getByTestId('modal-edit-identity-field-domain').fill(patch.domainFilter);
    }
    await modal.getByTestId('modal-edit-identity-btn-apply').click();
  }

  if (
    patch.configMode !== undefined
    || patch.presetId !== undefined
    || patch.groupNameSource !== undefined
  ) {
    await wizard.clickModifySection(1);
    const modal = page.getByTestId('modal-edit-config');
    if (patch.configMode !== undefined) {
      await modal.getByTestId(`config-mode-${patch.configMode}`).click();
    }
    if (patch.configMode === 'preset' && patch.presetId) {
      await modal.locator(`[data-value="${patch.presetId}"]`).first().click();
    }
    await modal.getByRole('button', { name: /apply|save/i }).click();
  }

  if (patch.deduplicationEnabled !== undefined) {
    await wizard.clickModifySection(2);
    const modal = page.getByTestId('modal-edit-options');
    const sw = modal.locator('[role="switch"]');
    const state = await sw.getAttribute('data-state');
    const isOn = state === 'checked';
    if (isOn !== patch.deduplicationEnabled) await sw.click();
    await modal.getByRole('button', { name: /apply|save/i }).click();
  }

  await wizard.clickSave();
  await wizard.expectHidden();
}
