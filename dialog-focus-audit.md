# Audit: initial focus of dialogs

Date: 2026-05-05
Branch: `claude/dialog-initial-focus-6R6oa`

## Summary

15 dialogs identified in the extension. 5 already have correct focus management (custom `onOpenAutoFocus` or `data-autofocus`). 10 need an action.

The main issue: `DialogShell.defaultOnOpenAutoFocus` does nothing when no `[data-autofocus]` element is present. Radix then gives focus to the close cross (the first focusable element of the DOM). Pressing `Enter` immediately after opening closes the dialog.

---

## Full inventory

### Category A: `DialogShell` / `WizardModal`

| # | Component | File | WAI-ARIA type | Current focus | Recommended target | `data-autofocus`? | Custom `onOpenAutoFocus`? | Action | Risk |
|---|---|---|---|---|---|---|---|---|---|
| 1 | DialogShell (base) | `src/components/UI/DialogShell/DialogShell.tsx` | Base | Cross when no `[data-autofocus]` | Title (fallback) | N/A | Yes (defaultOnOpenAutoFocus) | Strengthen fallback to the title (tabIndex=-1) | Low |
| 2 | WorkspaceFormDialog | `src/components/UI/Workspace/WorkspaceFormDialog.tsx` | Form (workspace create/edit) | Name input (Radix default: first focusable in Dialog.Content = likely the input since the cross is missing) | Name input (`#workspace-form-name`) | No | No | Migrate to DialogShell + `data-autofocus` on the input | Low |
| 3 | SessionEditDialog | `src/components/Core/Session/SessionEditDialog.tsx` | Form (session edit) | Name input (`#session-edit-name`) | Name input | No | Yes (target `#session-edit-name`) | Verify only: OK | Low |
| 4 | RestoreWizard step 0 | `src/components/UI/SessionWizards/RestoreWizard.tsx` | Wizard | Restore button | Restore button | Yes (on the button) | No | OK. Add `data-autofocus` on step 1 | Low |
| 5 | SnapshotWizard | `src/components/UI/SessionWizards/SnapshotWizard.tsx` | Wizard (session capture) | Session name input | Name input | No | Yes (target `input[aria-label]`) | Verify only: OK | Low |
| 6 | RuleWizardModal | `src/components/Core/DomainRule/RuleWizardModal.tsx` | Multi-step wizard (domain rule) | Label input | Label input | No | Yes (target `input[name="label"]`) | Verify only: OK | Low |
| 7 | ConfigEditModal | `src/components/Core/DomainRule/ConfigEditModal.tsx` | Form (rule config) | Cross (Radix fallback, no data-autofocus) | Title (new DialogShell fallback) | No | No | The title fallback applies after Lot 1 | Low |
| 8 | ImportWorkspaceDialog | `src/components/UI/Workspace/ImportWorkspaceDialog.tsx` | Wizard (workspace import) | Cross (Radix fallback) | Source textarea or first input on step 0 | No | No | Add `data-autofocus` on the first field | Low |
| 9 | ExportWorkspaceDialog | `src/components/UI/Workspace/ExportWorkspaceDialog.tsx` | Wizard (workspace export) | Cross (Radix fallback) | Title (fallback, content is mostly informational) | No | No | The title fallback applies after Lot 1 | Low |
| 10 | ImportSessionsWizard / ExportSessionsWizard | `src/components/UI/ImportExportWizards/` | Wizard (sessions and rules import/export) | Cross (Radix fallback) | Title (fallback) or first field | No | No | The title fallback applies after Lot 1 | Low |

### Category B: `AlertDialog.Root` direct

| # | Component | File | WAI-ARIA type | Current focus | Recommended target | `data-autofocus`? | Custom `onOpenAutoFocus`? | Action | Risk |
|---|---|---|---|---|---|---|---|---|---|
| 11 | ConfirmDialog | `src/components/UI/ConfirmDialog/ConfirmDialog.tsx` | Destructive confirmation (red) | Cancel button (Radix AlertDialog default: first focusable) | Cancel button (explicit) | No | No | `data-autofocus` + `focusAutoFocusTarget` | Low |
| 12 | WorkspaceDeleteConfirmDialog | `src/components/UI/Workspace/WorkspaceDeleteConfirmDialog.tsx` | Destructive with required input | First focusable element (TextField or Cancel) | Workspace name input | No | No | `data-autofocus` on the TextField + `focusAutoFocusTarget` | Low |
| 13 | AlertDialogShell | `src/components/Core/TabTree/AlertDialogShell.tsx` | 3-button destructive confirmation | Cancel button (Radix default) | Cancel button (explicit) | No | No | `data-autofocus` + `focusAutoFocusTarget` | Low |
| 14 | SessionEditDialog sub-AlertDialog | `src/components/Core/Session/SessionEditDialog.tsx` (lines 229-248) | Destructive confirmation (leave without saving) | First focusable element | Cancel button | No | No | `data-autofocus` + `focusAutoFocusTarget` | Low |

### Category C: `Dialog.Root` direct (outside DialogShell)

| # | Component | File | WAI-ARIA type | Current focus | Recommended target | `data-autofocus`? | Custom `onOpenAutoFocus`? | Action | Risk |
|---|---|---|---|---|---|---|---|---|---|
| 15 | ShortcutsDrawer | `src/components/UI/ShortcutsPanel/ShortcutsDrawer.tsx` | Navigation/help panel (modal) | First open trigger inside ShortcutsContent (via `focusFirstOpenTrigger`) | First trigger (behavior OK) | No | Yes (requestAnimationFrame + fragile document.querySelector) | Harmonize: replace `document.querySelector` with `e.currentTarget` | Low |

---

## Detailed status per component

### 1. DialogShell
- **Issue:** `defaultOnOpenAutoFocus` falls back to the Radix behavior (cross) when no `[data-autofocus]` is present.
- **Fix:** Add `tabIndex={-1}` and `data-dialog-title` on `Dialog.Title`. Update the fallback to target `[data-dialog-title]` before letting Radix act.

### 2. WorkspaceFormDialog
- **Issue:** Uses `Dialog.Root` directly, not `DialogShell`. No `onOpenAutoFocus`. The first focusable element is likely the name input (no DialogCloseButton here), but it is not guaranteed nor documented.
- **Fix:** Migrate to `DialogShell`. Add `data-autofocus` on the name input.

### 11. ConfirmDialog
- **Issue:** No `onOpenAutoFocus`. Radix AlertDialog focuses the first focusable element (usually Cancel), but that is implicit and not guaranteed if the structure changes.
- **Fix:** Make the behavior explicit with `data-autofocus` + `focusAutoFocusTarget`.

### 12. WorkspaceDeleteConfirmDialog
- **Issue:** No `onOpenAutoFocus`. The input follows the title and the description in the DOM, before the buttons. Radix could focus an unexpected element.
- **Fix:** `data-autofocus` on the input + `focusAutoFocusTarget`. Rationale: the Confirm button is disabled until the correct text is typed, so there is no risk.

### 13. AlertDialogShell
- **Issue:** No `onOpenAutoFocus`. Three buttons: Cancel, SoftAction, DestructiveAction. Radix focuses Cancel (first), OK by default but implicit.
- **Fix:** Make it explicit with `data-autofocus` + `focusAutoFocusTarget`.

### 14. SessionEditDialog sub-AlertDialog
- **Issue:** Nested "unsaved changes" AlertDialog. No `onOpenAutoFocus`. Buttons: Cancel, Leave (red).
- **Fix:** `data-autofocus` on Cancel + `focusAutoFocusTarget`.

### 15. ShortcutsDrawer
- **Issue:** `document.querySelector('[data-testid="shortcuts-drawer"]')` is fragile (it could match the wrong element if multiple instances exist). Functional but not robust.
- **Fix:** Replace with `e.currentTarget as HTMLElement`.

---

## Risk analysis on existing E2E tests

| Test | File | Interaction | Impact |
|---|---|---|---|
| "Escape closes the wizard modal" | `tests/e2e/rule-wizard.spec.ts` | Presses Escape after opening | None: Escape != Enter |
| `urlInput.press('Enter')` | `tests/e2e/session-editor.spec.ts` | Enter inside an input within the dialog | None: focus is already on the input |
| `nameInput.press('Enter')` | `tests/e2e/session-editor.spec.ts` | Enter inside a group-rename input | None: focus is already on the input |

No existing spec relies on the initial focus being on the cross. No fix is required on the existing specs.

---

## Action plan (batches)

| Batch | Description | Files modified |
|---|---|---|
| Lot 1 | Strengthen DialogShell fallback to the title | `DialogShell.tsx`, `DialogShell.stories.tsx` (new) |
| Lot 2 | Create `focusAutoFocusTarget` helper | `autoFocusHandler.ts` (new), `DialogShell/index.ts` |
| Lot 3 | AlertDialogs without focus management | `ConfirmDialog.tsx`, `AlertDialogShell.tsx`, `WorkspaceDeleteConfirmDialog.tsx`, `SessionEditDialog.tsx` |
| Lot 4 | Forms + WorkspaceFormDialog migration + ShortcutsDrawer | `WorkspaceFormDialog.tsx`, `ConfigEditModal.tsx`, `RestoreWizard.tsx`, `ImportWorkspaceDialog.tsx`, `ShortcutsDrawer.tsx` |
| Lot 5 | Stories + E2E test | `DialogShell.stories.tsx`, `ConfirmDialog.stories.tsx`, `AlertDialogShell.stories.tsx`, `dialog-initial-focus.spec.ts` |
| Lot 6 | User story US-A11Y001 | `user-stories/US-A11Y-focus-dialog.md` |
