# User Stories - Domain A11Y: Accessibility

---

## US-A11Y001 - Initial focus of dialogs

**As a** user navigating with the keyboard or using a screen reader,
**I want** the initial focus of a dialog to be placed on the most relevant element when it opens,
**so that** I do not accidentally close the dialog by pressing `Enter`, and I immediately understand the context or the expected action.

### Context

Radix UI (`Dialog.Content`, `AlertDialog.Content`) places focus by default on the first focusable element in the DOM, which is almost always the close cross (`DialogCloseButton`). An immediate press on `Enter` then closes the dialog, which contradicts the WAI-ARIA Authoring Practices Guide (APG) Modal Dialog Pattern.

### Initial focus convention by dialog type

| Type | Initial focus target | Rationale |
|---|---|---|
| Form (creation, editing) | First useful input field | The user wants to type, not close. |
| Multi-step wizard | First useful field of the active step, or main button if the step has no field | Same idea, adapted to progression. |
| Destructive confirmation | **Cancel** button | WAI-ARIA APG Alert Dialog. Avoids accidental confirmation. |
| Destructive with mandatory input | The validation input (the Confirm button is disabled until the input matches) | No risk of accidental action: Confirm is disabled. |
| Informational (no field or clear main action) | Dialog title (`tabIndex={-1}`) | WAI-ARIA APG, third case. The screen reader announces the title on opening. |

**Absolute rule: `DialogCloseButton` must never receive the initial focus.**

### Acceptance criteria

- [ ] Opening the rule creation wizard places focus on the "Label" input.
- [ ] Opening the workspace creation dialog places focus on the name input.
- [ ] Opening a `ConfirmDialog` (destruction) places focus on the Cancel button. Pressing `Enter` immediately closes the dialog without triggering the destructive action.
- [ ] Opening the `AlertDialogShell` places focus on the Cancel button (the least destructive of the three).
- [ ] Opening the `RestoreWizard` places focus on the Restore button (step 0).
- [ ] Opening a `DialogShell` without a `[data-autofocus]` element places focus on the dialog title (not on the close cross).
- [ ] The programmatically focused title does not display a visible focus ring (it is a non-interactive focus target).
- [ ] The `WorkspaceDeleteConfirmDialog` places focus on the name input (not on Cancel, because Confirm is disabled until the correct value is typed).

### Implementation

#### Shared utility

`src/components/UI/DialogShell/autoFocusHandler.ts` exports `focusAutoFocusTarget(event: Event)`.
Pass this function as `onOpenAutoFocus` on `AlertDialog.Content`.

#### `data-autofocus` convention

Add `data-autofocus="true"` on the first target element (field or Cancel button depending on the type).
`DialogShell.defaultOnOpenAutoFocus` searches this attribute first, then falls back to the title.

#### Title fallback in `DialogShell`

`Dialog.Title` receives `tabIndex={-1}` and `data-dialog-title` to be programmatically focusable.
`defaultOnOpenAutoFocus` targets `[data-dialog-title]` if no `[data-autofocus]` is present.

### Associated tests

- Storybook stories: `DialogShell.stories.tsx`, `ConfirmDialog.stories.tsx`, `AlertDialogShell.stories.tsx`
  (play functions checking `document.activeElement`).
- E2E test: `tests/e2e/dialog-initial-focus.spec.ts` (`[US-A11Y001]`).

### Covered dialogs

| Component | Path | Focus target |
|---|---|---|
| RuleWizardModal | `Core/DomainRule/RuleWizardModal.tsx` | Label input (existing custom `onOpenAutoFocus`) |
| SessionEditDialog | `Core/Session/SessionEditDialog.tsx` | Session name input (existing custom `onOpenAutoFocus`) |
| SnapshotWizard | `UI/SessionWizards/SnapshotWizard.tsx` | Session name input (existing custom `onOpenAutoFocus`) |
| RestoreWizard | `UI/SessionWizards/RestoreWizard.tsx` | Restore button (`data-autofocus` steps 0 and 1) |
| WorkspaceFormDialog | `UI/Workspace/WorkspaceFormDialog.tsx` | Workspace name input (`data-autofocus`, migrated to DialogShell) |
| ConfirmDialog | `UI/ConfirmDialog/ConfirmDialog.tsx` | Cancel button (`data-autofocus` + `focusAutoFocusTarget`) |
| AlertDialogShell | `Core/TabTree/AlertDialogShell.tsx` | Cancel button (`data-autofocus` + `focusAutoFocusTarget`) |
| WorkspaceDeleteConfirmDialog | `UI/Workspace/WorkspaceDeleteConfirmDialog.tsx` | Name input (`data-autofocus` + `focusAutoFocusTarget`) |
| SessionEditDialog sub-AlertDialog | `Core/Session/SessionEditDialog.tsx` | Cancel button (`data-autofocus` + `focusAutoFocusTarget`) |
| ConfigEditModal | `Core/DomainRule/ConfigEditModal.tsx` | Title (DialogShell fallback) |
| ExportWorkspaceDialog | `UI/Workspace/ExportWorkspaceDialog.tsx` | Title (DialogShell fallback) |
| ImportWorkspaceDialog | `UI/Workspace/ImportWorkspaceDialog.tsx` | Title (DialogShell fallback) |
| ImportSessionsWizard / ExportSessionsWizard | `UI/ImportExportWizards/` | Title (DialogShell fallback) |
| ShortcutsDrawer | `UI/ShortcutsPanel/ShortcutsDrawer.tsx` | First trigger (custom, harmonized with `e.currentTarget`) |
