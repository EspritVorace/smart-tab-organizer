# User Stories - Domain IE: Import / Export of domain rules

> Behaviors identified in `src/components/UI/ImportExportPage/`,
> `src/utils/importClassification.ts` and `src/components/UI/WizardStepper/`
> not covered by existing US.

---

## US-IE001 - Selecting the JSON source (file or text)

**As a** user,
**I want** to be able to provide the JSON to import either by drag-and-dropping a `.json` file or by pasting it directly into a text field,
**so that** I can freely choose the most convenient method depending on my environment.

### Acceptance criteria

- [ ] The import wizard offers two selectable input modes: **File** and **Text**.
- [ ] In **File** mode: a drop zone accepts drag-and-drop; a "Browse" button opens the native file picker (filter `.json`).
- [ ] The drop zone visually changes state (highlighted border) while a file is hovered over it.
- [ ] In **Text** mode: a multi-line field (monospace font) lets the user paste or type raw JSON.
- [ ] Switching between modes preserves the data already entered in each mode.
- [ ] The "Next" button stays disabled as long as no valid JSON has been loaded.

---

## US-IE002 - Validation of the imported JSON

**As a** user,
**I want** to be informed immediately if the provided JSON is invalid or does not match the expected format,
**so that** I can correct the file or text before continuing.

### Acceptance criteria

- [ ] If the JSON is syntactically invalid (e.g. missing comma), a red error message is shown with the label "Invalid JSON".
- [ ] If the JSON is syntactically correct but does not match the expected schema, the validation errors are listed by field (e.g. "label: required").
- [ ] If the JSON is valid, a green success indicator confirms the loading and reports the number of detected rules.
- [ ] An empty text field shows neither error nor success: it resets the state.
- [ ] Validation runs in real time on every change to the text field.

---

## US-IE003 - Classification of imported rules

**As a** user,
**I want** to see the rules from the imported file classified into three categories before confirming the import,
**so that** I know exactly what will be added, modified, or ignored.

### Acceptance criteria

- [ ] Rules are classified into three groups:
  - **New**: no existing rule has the same label (case-insensitive).
  - **Conflicting**: an existing rule has the same label but with different properties.
  - **Identical**: an existing rule has the same label with exactly the same properties.
- [ ] Each group has a counter (e.g. "3 new rules").
- [ ] Identical rules are displayed grayed out with the "Already Exists" badge and are **not** selectable.
- [ ] The selection step is presented in a scrollable area (fixed maximum height).

---

## US-IE004 - Individual selection of new rules

**As a** user,
**I want** to be able to choose which new rules to import among those proposed,
**so that** I only add the rules I am interested in.

### Acceptance criteria

- [ ] Each new rule has a checkbox, checked by default.
- [ ] Unchecking a rule excludes it from the import without removing it from the display.
- [ ] The "Rules to import" counter is updated in real time based on the checked boxes.
- [ ] The "Next" button is disabled if the counter reaches zero (no rule selected).

---

## US-IE005 - Global resolution of conflicts

**As a** user,
**I want** to choose how conflicting rules are handled (overwrite, duplicate, or ignore),
**so that** I can apply a consistent strategy to all conflicts in a single choice.

### Acceptance criteria

- [ ] Three resolution modes are offered (segmented control):
  - **Overwrite**: the imported rule replaces the existing rule, keeping its identifier.
  - **Duplicate**: the imported rule is created as a new entry with a new identifier.
  - **Ignore**: conflicting rules are not imported.
- [ ] The selected mode applies to **all** conflicting rules.
- [ ] The "Rules to import" counter takes into account the chosen mode (ignored rules are not counted).
- [ ] In **Overwrite** mode, a warning alert is shown at the confirmation step.

---

## US-IE006 - Viewing differences for a conflicting rule

**As a** user,
**I want** to be able to inspect the differences between the existing rule and the imported rule for each conflict,
**so that** I can make an informed decision about the resolution strategy.

### Acceptance criteria

- [ ] Each conflicting rule displays a warning icon (orange triangle).
- [ ] A "View differences" button (eye icon) is available on each conflicting rule.
- [ ] Clicking that button opens a contextual panel (popover) listing the different properties.
- [ ] For each different property, the current value and the imported value are displayed with distinct emphasis (e.g. red badge "Current value" / green badge "Imported value").

---

## US-IE007 - Confirmation and result of the import

**As a** user,
**I want** to see a recap before validating the import, then a numerical feedback once the import is done,
**so that** I can confirm the operation knowingly and verify that it went as expected.

### Acceptance criteria

- [ ] The confirmation step shows a summary: number of rules added, overwritten, duplicated, or ignored according to the choices in the previous step.
- [ ] If **Overwrite** mode is selected and there are conflicts, an orange alert reminds the user that existing rules will be replaced.
- [ ] After validation, the dialog closes automatically.
- [ ] A system notification appears with the title "Rules imported" and a message indicating the counters (e.g. "3 rule(s) added, 1 rule(s) overwritten").
- [ ] The wizard state is reset every time the dialog is reopened.

---

## US-IE008 - Selecting the rules to export

**As a** user,
**I want** to choose which rules to include in the export file,
**so that** I share only the relevant rules.

### Acceptance criteria

- [ ] All rules are pre-selected by default when opening the export wizard.
- [ ] Each rule has a checkbox.
- [ ] "Select all" and "Deselect all" buttons are available.
- [ ] Disabled rules are flagged with a "Disabled" badge but remain selectable.
- [ ] The "Next" button is disabled if no rule is selected.

---

## US-IE009 - Export to file or clipboard

**As a** user,
**I want** to export the selected rules either to a `.json` file or to the clipboard,
**so that** I can transfer them to another install or share them easily.

### Acceptance criteria

- [ ] The footer of the export step contains a primary "Export" button and a chevron button (v) opening a dropdown menu.
- [ ] The dropdown menu offers two options: "Export to File" (default) and "Copy to Clipboard".
- [ ] Export to file proposes a default name `smarttab_organizer_rules.json`.
- [ ] On browsers supporting the FileSystem API (e.g. Chrome), the native save dialog is used; on others, an automatic download is triggered.
- [ ] Cancelling the native dialog does not produce a visible error.
- [ ] After a successful export (file or clipboard), the dialog closes automatically.
- [ ] A system notification appears with the title "Rules exported".
- [ ] The exported JSON is formatted with a 2-space indentation.

---

## US-IE010: Optional note on export (rules and sessions)

**As a** user exporting rules or sessions,
**I want** to be able to add a free-form note to the export file,
**so that** I can document the content or the context of the export for the recipient.

### Acceptance criteria

- [ ] The export wizard (rules and sessions) exposes a `TextArea` field (Radix, vertically resizable) labeled **"Note"**.
- [ ] The field is optional: leaving it empty does not affect the export.
- [ ] If a note is entered, the exported JSON contains a `note` field at the root of the object (e.g. `{ "note": "...", "rules": [...] }`).
- [ ] If the field is empty, the `note` field does not appear in the exported JSON.

---

## US-IE011: Showing the note on import (rules and sessions)

**As a** user importing a JSON file containing a note,
**I want** to see the author's note shown in the import wizard,
**so that** I understand the context of the file before validating the import.

### Acceptance criteria

- [ ] If the imported JSON contains a `note` field at the root, it is shown in a gray callout above the classification list (step 2 of the wizard).
- [ ] If the JSON does not contain a `note` field, no callout is shown.
- [ ] The note is shown read-only (no editable field).

---

## US-IE012: Envelope format for session export

**As a** user,
**I want** session export to use an envelope format (`{ note?, sessions: [...] }`),
**so that** the file can contain metadata (such as the note) in addition to the sessions.

### Acceptance criteria

- [ ] Session export produces a JSON object `{ sessions: [...] }` (not a raw array).
- [ ] If a note is written, it is included: `{ note: "...", sessions: [...] }`.
- [ ] On import, the wizard accepts both formats: the new envelope format and the old format (raw array `[...]`) for backward compatibility.
- [ ] The Zod schema `importSessionsDataSchema` validates both formats.

---

## US-IE013: Pinned/normal sub-grouping in session export

**As a** user exporting sessions,
**I want** the selection list in the export wizard to be organized into two sub-groups (pinned sessions, normal sessions),
**so that** I can more easily select sessions according to their status.

### Acceptance criteria

- [ ] If pinned sessions exist, they are shown in a "Pinned Sessions" sub-group with a header (`Pin` icon + title + group checkbox).
- [ ] If normal sessions exist, they are shown in a "Sessions" sub-group with a header (`Archive` icon + title + group checkbox).
- [ ] The two sub-groups are separated by a `Separator` if both exist.
- [ ] The group checkbox lets the user select/deselect all sessions of the sub-group.
- [ ] The group checkbox shows an indeterminate state if only some of the sessions in the group are selected.
- [ ] The individual "Pinned" badge is removed from session rows in the export (the grouping makes it redundant).
- [ ] Global "Select all" / "Deselect all" buttons continue to work on the entire set of sessions.
- [ ] If all sessions are of the same type (all pinned or all normal), only one sub-group is shown without a sub-group header.
