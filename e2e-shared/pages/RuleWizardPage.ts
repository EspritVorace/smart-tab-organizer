/**
 * Page Object for the Rule Wizard (create + edit).
 *
 * Wraps the Radix dialog opened from the Domain Rules options page when
 * the user clicks "Add rule" (creation) or "Edit" on a rule's menu (edit).
 * In creation mode the wizard walks through four steps (Identity, Config,
 * Options, Summary). In edit mode the wizard lands directly on the summary
 * view and exposes one "Modify" button per section, each opening a
 * dedicated sub-dialog (`IdentityEditModal`, `ConfigEditModal`,
 * `OptionsEditModal`).
 *
 * Exposes atomic building blocks only: step-scoped locators, per-step
 * actions (`fillIdentity`, `selectConfigMode`, ...), navigation
 * (`clickNext`, `clickBack`) and submission (`clickCreate`, `clickSave`).
 * Composed flows belong in `e2e-shared/actions/rules-management.ts`.
 *
 * Selectors target the English UI (`--lang=en-US`). Subclass and override
 * the locator getters to retarget another locale.
 *
 * Note on `ConfigMode`: the codebase uses `'preset' | 'ask' | 'manual'`;
 * the Page Object exposes the same triplet (some legacy wording calls the
 * "ask" mode "custom", they are equivalent at the UI level).
 */
import { expect, type Locator, type Page } from '@playwright/test';
import { DialogPage } from './DialogPage.js';

export type RuleWizardConfigMode = 'preset' | 'ask' | 'manual';

/**
 * Group-name sources exposed in the manual configuration mode (mirrors
 * `GroupNameSourceValue` in the codebase, omitting variants users cannot
 * select from the wizard's select).
 */
export type RuleWizardGroupNameSource =
  | 'title'
  | 'url'
  | 'manual'
  | 'smart'
  | 'smart_manual'
  | 'smart_preset'
  | 'smart_label';

export class RuleWizardPage extends DialogPage {
  constructor(page: Page) {
    super(page);
  }

  override dialog(): Locator {
    return this.page.getByTestId('wizard-rule');
  }

  // ─── Locators: step containers ───────────────────────────────────────────

  /** Step 1 container (Identity inputs). */
  step1Identity(): Locator {
    return this.dialog().getByTestId('wizard-rule-step-1');
  }

  /** Step 2 container (Configuration mode + preset/manual fields). */
  step2Config(): Locator {
    return this.dialog().getByTestId('wizard-rule-step-2');
  }

  /** Step 3 container (Options: deduplication toggle + match mode). */
  step3Options(): Locator {
    return this.dialog().getByTestId('wizard-rule-step-3');
  }

  /** Step 4 container (Summary cards + Create button). */
  step4Summary(): Locator {
    return this.dialog().getByTestId('wizard-rule-step-4');
  }

  /** Summary view rendered in edit mode (no stepper). */
  editSummary(): Locator {
    return this.dialog().getByTestId('wizard-rule-edit-summary');
  }

  /** Wizard stepper component (creation mode only). */
  stepper(): Locator {
    return this.dialog().getByTestId('wizard-rule-stepper');
  }

  // ─── Locators: identity fields ───────────────────────────────────────────

  /** Rule label text input. */
  labelInput(): Locator {
    return this.dialog().getByTestId('wizard-rule-field-label');
  }

  /** Rule domain filter text input. */
  domainFilterInput(): Locator {
    return this.dialog().getByTestId('wizard-rule-field-domain');
  }

  /**
   * Category radiogroup container, rendered inline as its own row in step 1.
   * Anchored by data-testid so it stays locale-agnostic.
   */
  categoryField(): Locator {
    return this.step1Identity().getByTestId('wizard-rule-field-category');
  }

  // ─── Locators: config & options ──────────────────────────────────────────

  /** Configuration mode radio (one of `preset`, `ask`, `manual`). */
  configModeRadio(mode: RuleWizardConfigMode): Locator {
    return this.dialog().getByTestId(`config-mode-${mode}`);
  }

  /** SearchableSelect trigger for picking a preset in preset mode. */
  presetTrigger(): Locator {
    return this.dialog().locator('#presetId');
  }

  /** Single-line CodeMirror editor for the title parsing regex (manual mode). */
  titleRegexField(): Locator {
    return this.dialog().getByTestId('title-regex-field');
  }

  /** Single-line CodeMirror editor for the URL parsing regex (manual + regex mode). */
  urlRegexField(): Locator {
    return this.dialog().getByTestId('url-regex-field');
  }

  /** Deduplication enable/disable switch on step 3. */
  deduplicationSwitch(): Locator {
    return this.dialog().locator('[role="switch"]');
  }

  /**
   * `radiogroup` for the deduplication match mode (visible only when
   * deduplication is enabled).
   */
  deduplicationMatchModeGroup(): Locator {
    return this.dialog().locator('[role="radiogroup"]');
  }

  // ─── Locators: footer buttons ────────────────────────────────────────────

  nextButton(): Locator {
    return this.dialog().getByTestId('wizard-rule-btn-next');
  }

  /** Previous button (visible from step 2 onwards). */
  backButton(): Locator {
    return this.dialog().getByRole('button', { name: /previous/i });
  }

  /** Create button (creation mode, only on step 4). */
  createButton(): Locator {
    return this.dialog().getByTestId('wizard-rule-btn-create');
  }

  /** Save button (edit mode). */
  saveButton(): Locator {
    return this.dialog().getByTestId('wizard-rule-btn-save');
  }

  /** Cancel button (creation step 1 and edit mode). */
  cancelButton(): Locator {
    return this.dialog().getByRole('button', { name: /cancel/i });
  }

  /**
   * "Modify" button in the summary, scoped to a given section (0 = Identity,
   * 1 = Config, 2 = Options). In creation mode it jumps back to the step;
   * in edit mode it opens the matching sub-dialog.
   */
  modifyButton(stepIndex: 0 | 1 | 2): Locator {
    return this.dialog().getByTestId(`wizard-rule-edit-modify-step-${stepIndex}`);
  }

  // ─── Atomic actions: identity (step 1) ───────────────────────────────────

  /** Fill the rule label input. */
  async fillLabel(label: string): Promise<void> {
    await this.labelInput().fill(label);
  }

  /** Fill the domain filter input. */
  async fillDomainFilter(domain: string): Promise<void> {
    await this.domainFilterInput().fill(domain);
  }

  /**
   * Pick a category by its accessible label in the inline radiogroup of
   * step 1. Pass `null` to select the "None" swatch.
   */
  async selectCategory(label: string | null): Promise<void> {
    const target = label === null ? /no category|none/i : new RegExp(label, 'i');
    await this.categoryField().getByRole('radio', { name: target }).click();
  }

  // ─── Atomic actions: configuration (step 2) ──────────────────────────────

  /** Pick a configuration mode in step 2. */
  async selectConfigMode(mode: RuleWizardConfigMode): Promise<void> {
    await this.configModeRadio(mode).click();
  }

  /**
   * Pick a preset by its id. The SearchableInlineList renders one button
   * per preset whose `data-value` carries the preset id; click it directly
   * to avoid filtering by visible name (which depends on the preset catalog
   * and the active locale).
   */
  async selectPreset(presetId: string): Promise<void> {
    await this.dialog().locator(`[data-value="${presetId}"]`).first().click();
  }

  /**
   * Pick a group-name source (manual mode only). The enum values map to
   * the visible English labels rendered by the Radix Select. Override this
   * method in a subclass to retarget another locale.
   */
  async setGroupNameSource(source: RuleWizardGroupNameSource): Promise<void> {
    const labels: Record<RuleWizardGroupNameSource, string> = {
      title: 'Title',
      url: 'URL',
      manual: 'Ask',
      smart: 'Smart',
      smart_manual: 'Smart + Ask',
      smart_preset: 'Smart + Preset',
      smart_label: 'Smart + Label',
    };
    await this.dialog().locator('.rt-SelectTrigger').first().click();
    // Radix Select.Content portals the options outside the dialog; anchor on
    // the page and match the option's accessible name.
    await this.page
      .getByRole('option', { name: new RegExp(`^${labels[source]}`, 'i') })
      .first()
      .click();
  }

  /**
   * Type a pattern into a CodeMirror regex field. The editor exposes no
   * `<input>`, so we focus the `.cm-content` node and drive it through the
   * keyboard (a `.fill()` would target a non-existent form value).
   */
  private async typeRegexField(field: Locator, pattern: string): Promise<void> {
    const content = field.locator('.cm-content');
    await content.click();
    await this.page.keyboard.press('ControlOrMeta+a');
    await this.page.keyboard.press('Delete');
    if (pattern) await this.page.keyboard.type(pattern);
  }

  /** Fill the title parsing regex editor (manual mode, title-based source). */
  async fillTitleRegex(pattern: string): Promise<void> {
    await this.typeRegexField(this.titleRegexField(), pattern);
  }

  /** Fill the URL parsing regex editor (manual mode, URL regex extraction). */
  async fillUrlRegex(pattern: string): Promise<void> {
    await this.typeRegexField(this.urlRegexField(), pattern);
  }

  // ─── Atomic actions: options (step 3) ────────────────────────────────────

  /** Toggle the deduplication switch on step 3 to match `enabled`. */
  async setDeduplicationEnabled(enabled: boolean): Promise<void> {
    const sw = this.deduplicationSwitch();
    const state = await sw.getAttribute('data-state');
    const isOn = state === 'checked';
    if (isOn !== enabled) await sw.click();
  }

  // ─── Atomic actions: navigation ──────────────────────────────────────────

  async clickNext(): Promise<void> {
    await this.nextButton().click();
  }

  async clickBack(): Promise<void> {
    await this.backButton().click();
  }

  /** Submit the creation wizard from step 4. */
  async clickCreate(): Promise<void> {
    await this.createButton().click();
  }

  /** Save the edit wizard (commits the summary). */
  async clickSave(): Promise<void> {
    await this.saveButton().click();
  }

  /** Close the wizard via its Cancel button. */
  async clickCancel(): Promise<void> {
    await this.cancelButton().click();
  }

  /**
   * Click the "Modify" button for the given summary section (0 = Identity,
   * 1 = Config, 2 = Options).
   */
  async clickModifySection(stepIndex: 0 | 1 | 2): Promise<void> {
    await this.modifyButton(stepIndex).click();
  }

  /**
   * Open the Options sub-modal from the edit wizard's summary view. The
   * edit wizard lands directly on the summary; each section exposes a
   * dedicated "Modify" button (testid `wizard-rule-edit-modify-step-N`)
   * that opens the matching sub-dialog. Index 2 targets the Options
   * section (`OptionsEditModal`). Returns nothing; callers instantiate the
   * matching `OptionsEditModalPage` Page Object to interact with the modal.
   */
  async openEditOptionsModal(): Promise<void> {
    await this.clickModifySection(2);
    await this.page
      .getByTestId('modal-edit-options')
      .waitFor({ state: 'visible' });
  }

  // ─── Atomic assertions ───────────────────────────────────────────────────

  /** Assert the wizard is on a given step container (1-based). */
  async expectOnStep(step: 1 | 2 | 3 | 4): Promise<void> {
    const containers = [
      this.step1Identity(),
      this.step2Config(),
      this.step3Options(),
      this.step4Summary(),
    ];
    await expect(containers[step - 1]).toBeVisible();
  }

  /**
   * Assert the wizard opened in edit mode for `ruleId`. The wizard does not
   * surface the rule id directly; the contract is "no stepper, summary view
   * visible" which the edit-mode rendering enforces.
   */
  async expectInEditMode(_ruleId?: string): Promise<void> {
    await expect(this.editSummary()).toBeVisible();
    await expect(this.stepper()).toHaveCount(0);
  }
}
