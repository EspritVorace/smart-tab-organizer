# User Stories - Domain RW: Rule creation and editing wizard

> Replacement of the flat modal form `DomainRuleFormModal` with a 4-step wizard for creation, and with an editable summary view for modification.
> Existing components reused: `WizardStepper`, `SegmentedControl` (Radix), `CategoryPicker`.
> Behaviors tested in `tests/e2e/rule-wizard.spec.ts`.

---

## Navigation model

### Creation (4-step wizard)

```
Step 1: Identity        -> Category, label, domain filter
Step 2: Configuration   -> Mode (SegmentedControl) + conditional fields based on the mode
Step 3: Options         -> Deduplication
Step 4: Summary         -> Read-only + "Create" button
```

### Edition (summary view)

```
Zone 1: Identity            -> Category, label, domain filter (directly editable fields)
Zone 2: Configuration       -> Textual summary of the mode + pencil opening a dedicated modal
Zone 3: Misc options        -> Section collapsed by default, expandable to edit
```

---

## Design decisions

- **Deduplication**: 2 modes only (`exact`, `includes`), no extension of the current Zod schema.
- **Mode selector**: Radix `SegmentedControl` (already used in the current form), extracted to `WizardStep2Config`.
- **Manual mode**: all 7 values of `groupNameSource` available (like the current form).
- **Tests**: new file `tests/e2e/rule-wizard.spec.ts` plus update of `domain-rules.spec.ts`.

---

## US-RW001 - Step 1: enter the rule identity

**As a** user creating a rule,
**I want** to enter the logical category, the label, and the domain filter in a dedicated first step,
**so that** I can lay out the identity of the rule before configuring its behavior.

### Acceptance criteria

- [ ] Step 1 shows three fields: category selector (`categoryId`), label text field (`label`), domain filter text field (`domainFilter`).
- [ ] The category selector uses the existing `CategoryPicker` component. The "No category" value is always available and corresponds to `categoryId = null`.
- [ ] The label field is required. If empty when clicking "Next", an error message is shown under the field and navigation to step 2 is blocked.
- [ ] The label must be unique among existing rules (case-insensitive), validated via `createDomainRuleSchemaWithUniqueness`. If duplicated, an error message is shown and navigation is blocked.
- [ ] The domain filter field is required and must pass `createDomainFilterValidator` validation. If invalid, an error message is shown and navigation is blocked.
- [ ] The "Next" button is always visible but triggers validation on click.
- [ ] There is no "Previous" button on step 1.
- [ ] The `WizardStepper` shows 4 numbered steps. Step 1 is active.

### Implementation note

Component: `WizardStep1Identity`. The `categoryId` field uses the `CategoryPicker` component already present in the current form.

---

## US-RW002 - Step 2: naming mode configuration

**As a** user creating a rule,
**I want** to choose the configuration mode via a `SegmentedControl` and enter the corresponding information in the same step,
**so that** I can configure the group naming logic without additional navigation.

### Acceptance criteria

- [ ] Step 2 shows a `SegmentedControl` with three segments: "Preset", "Ask", "Manual". The selected mode is visually highlighted. The default value is "Preset".
- [ ] The active mode drives the `presetId` and `groupNameSource` fields according to the following mapping: Preset -> `presetId != null` / Ask -> `presetId = null` + `groupNameSource = 'ask'` / Manual -> `presetId = null` + `groupNameSource` based on selection.
- [ ] In **Preset** mode: the `SearchableSelect` (CMDK) existing in the current form is reused to choose among the available presets. `presetId` is updated on selection. The field is required to move to step 3.
- [ ] In **Ask** mode: no additional field is shown. A short explanatory text states that the group name will be requested at every matching tab opening.
- [ ] In **Manual** mode: a `Select` lets the user choose the source (all 7 values of `groupNameSource` available except `manual` and `smart_preset`), which sets `groupNameSource`. The corresponding regex field(s) are shown and validated by `createRegexValidator`.
- [ ] Switching mode preserves the values already entered in the other modes' fields.
- [ ] The "Previous" button goes back to step 1 without losing step 1 values.
- [ ] The "Next" button triggers validation of the active mode's fields before progressing.

### Implementation note

Component: `WizardStep2Config`. Mode-switching logic copied from the old `DomainRuleFormModal`.

---

## US-RW003 - Step 3: deduplication options

**As a** user creating a rule,
**I want** to configure deduplication in a dedicated step,
**so that** I can adjust the advanced behavior of the rule without overloading the previous steps.

### Acceptance criteria

- [ ] Step 3 shows a "Enable deduplication" `Switch` (`deduplicationEnabled`). Enabled by default in line with the Zod schema (`default(true)`).
- [ ] When deduplication is enabled, a `RadioGroup` shows the two available modes: "Exact URL" (`exact`), "URL included" (`includes`).
- [ ] When deduplication is disabled, the `RadioGroup` is hidden (not just grayed out).
- [ ] The "Previous" button goes back to step 2 without losing step 2 values.
- [ ] The "Next" button is always active at this step (no required field).
- [ ] No blocking validation is applied at this step.

### Implementation note

Component: `WizardStep3Options`. Also used in the collapsible Options section of edit mode.

---

## US-RW004 - Step 4: summary and confirmation

**As a** user creating a rule,
**I want** to see a readable summary of my configuration before validating,
**so that** I can spot a mistake before the actual creation.

### Acceptance criteria

- [ ] Step 4 shows in read-only the set of values entered in steps 1 to 3, grouped in sections matching the steps.
- [ ] Each section of the summary has a discreet "Edit" button which, on click, jumps directly to the corresponding step without losing data from the other steps.
- [ ] The "Create" button is shown in place of "Next". It triggers the actual creation of the rule.
- [ ] The "Previous" button goes back to step 3.
- [ ] After a successful creation, the modal closes and the new rule appears in the list.
- [ ] If creation fails (unexpected error), an error message is shown in step 4 without closing the modal.

### Implementation note

Component: `WizardStep4Summary`.

---

## US-RW005 - Keyboard navigation in the wizard

**As a** keyboard user,
**I want** to navigate the wizard without using the mouse,
**so that** I can create a rule accessibly.

### Acceptance criteria

- [ ] The `Tab` key cycles through all interactive fields of the active step in visual order.
- [ ] Pressing `Enter` on the "Next" or "Create" button triggers the corresponding action.
- [ ] Pressing `Escape` closes the modal (Radix `Dialog.Root` native behavior).
- [ ] Focus is placed on the first interactive field (`input[name="label"]`) when the modal opens.
- [ ] The `WizardStepper` is visual navigation only: future steps are `aria-disabled="true"`. Backward navigation only happens via "Previous".

---

## US-RW006 - Edit mode: directly editable identity

**As a** user modifying an existing rule,
**I want** to see and edit the category, the label, and the domain filter directly in the summary view,
**so that** I can quickly correct the identity of a rule without going through a wizard.

### Acceptance criteria

- [ ] In edit mode, the modal opens directly on the summary view (not on step 1 of the wizard). No `WizardStepper` is shown.
- [ ] The "Identity" zone displays the `categoryId`, `label`, and `domainFilter` fields as editable fields (not read-only).
- [ ] The `categoryId` field uses the existing `CategoryPicker` component.
- [ ] The same validation rules as in step 1 of the wizard apply. Errors are shown inline below each field.
- [ ] Modifying the label or the domain does not trigger an immediate save: the global save is done via the "Save" button.

### Implementation note

Component: `EditSummaryView` -> Zone 1 Identity (same fields as `WizardStep1Identity`).

---

## US-RW007 - Edit mode: mode configuration via dedicated modal

**As a** user modifying an existing rule,
**I want** to see a readable summary of the current configuration mode and be able to modify it via a secondary modal,
**so that** I can understand the configuration in place and change it without leaving the summary view.

### Acceptance criteria

- [ ] The "Configuration" zone shows a summary text describing the active mode. Examples: "Preset: Jira", "Ask (name entered at each tab opening)", "Manual: Title".
- [ ] A pencil icon button is shown to the right of the summary. It is keyboard-accessible and has an `aria-label`.
- [ ] Clicking the pencil opens a secondary modal (`ConfigEditModal`). It contains the same `SegmentedControl` as step 2 of the wizard with the conditional fields.
- [ ] The secondary modal has its own "Cancel" and "Apply" buttons. "Apply" validates the active mode's fields and updates the local state of the rule without saving to storage. "Cancel" closes the modal without change.
- [ ] After "Apply", the summary text in the main view updates to reflect the new configuration.
- [ ] The actual save only happens when the main modal's "Save" button is clicked.

### Implementation note

Component: `ConfigEditModal`. Uses an independent local state (snapshot of values at opening time). No `react-hook-form` in the secondary modal.

---

## US-RW008 - Edit mode: misc options in a collapsed section

**As a** user modifying an existing rule,
**I want** to access deduplication options in a section collapsed by default,
**so that** I am not distracted by options that are rarely modified.

### Acceptance criteria

- [ ] The "Options" zone is rendered with a Radix `Collapsible` component, collapsed by default in edit mode.
- [ ] The section header shows a compact summary of the active options. Example: "Deduplication enabled, Exact URL".
- [ ] When expanded, the same content as in step 3 of the wizard is shown: `Switch` `deduplicationEnabled`, `RadioGroup` `deduplicationMatchMode`.
- [ ] Modifications in the expanded section are immediately reflected in the section header summary.
- [ ] The actual save only happens when the main modal's "Save" button is clicked.

### Implementation note

`EditSummaryView` -> Zone 3 Options. Reuses `WizardStep3Options`.

---

## US-RW009 - Persistence of the wizard state between steps

**As a** user navigating between wizard steps,
**I want** my entries to be preserved if I go back to a previous step,
**so that** I can correct a value without re-entering everything.

### Acceptance criteria

- [ ] Going back to step 1 from step 2 or later preserves the values entered in step 1.
- [ ] Going back to step 2 from step 3 or 4 preserves the selected mode and the mode's fields.
- [ ] Changing mode at step 2 after coming back to it preserves the values of the other modes via the `lastManualState` / `lastPresetState` refs.
- [ ] Closing the modal ("Cancel" button or `Escape` key) clears the wizard's internal state. Reopening starts from a fresh step 1.

### Implementation note

Persistence logic in `RuleWizardModal`: `lastManualState` and `lastPresetState` refs (copied from the old `DomainRuleFormModal`). Wizard state via `useState(step)`.

---

## US-RW010 - Wizard accessibility

**As a** user using a screen reader or keyboard navigation,
**I want** the wizard to be fully navigable without a mouse,
**so that** I can use the rule creation feature autonomously.

### Acceptance criteria

- [ ] The `WizardStepper` exposes `aria-current="step"` on the active step.
- [ ] Steps not yet reached are `aria-disabled="true"` in the stepper (prop `disableFutureNavigation`).
- [ ] Each step change announces the new step's title via a visually-hidden `aria-live="polite"` region in `RuleWizardModal`.
- [ ] The `SegmentedControl` at step 2 is natively accessible via the Radix component (role radiogroup).
- [ ] All decorative icons have `aria-hidden="true"`. The pencil icon button in edit mode has an explicit `aria-label`.

### Implementation note

`WizardStepper`: attributes `role="list"`, `role="listitem"`, `aria-current`, `aria-disabled`, `aria-hidden` on icons.
`RuleWizardModal`: `<div role="status" aria-live="polite">` with announcement `getMessage('wizardStepAnnouncement')`.
