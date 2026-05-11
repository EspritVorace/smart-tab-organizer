# User Stories - Domain E: Session editor (additions)

> Behaviors tested in `tests/e2e/session-editor.spec.ts` not covered by the existing US-E001 to US-E002.
> The US numbered below continue from US-E003.

---

## US-E003 - Tabs/groups summary in the editor header

**As a** user opening the editor of a session,
**I want** to see a summary of the number of tabs and groups contained in the session,
**so that** I know the size of the session before modifying it.

### Acceptance criteria

- [ ] The editor dialog shows the total number of tabs in the session (e.g. "3 tabs").
- [ ] The dialog shows the number of tab groups (e.g. "1 group").
- [ ] This information is scoped to the dialog and does not come from the session card visible in the background.

---

## US-E004 - Tab tree in the editor

**As a** user,
**I want** to see the list of session tabs organized in the editor,
**so that** I can visualize and manage the session content before saving it.

### Acceptance criteria

- [ ] The editor displays the session tabs with their title.
- [ ] Tabs belonging to a group are displayed under their respective group.
- [ ] Ungrouped tabs are visible in the free tabs section.

---

## US-E005 - Guard against unsaved changes

**As a** user,
**I want** to be warned if I try to close the editor with unsaved changes,
**so that** I do not accidentally lose my changes.

### Acceptance criteria

- [ ] Clicking "Cancel" **without** having made any change closes the dialog immediately, without alert.
- [ ] Clicking "Cancel" **after** having modified at least one field (e.g. the session name) shows an alert dialog (`alertdialog`) containing the word "unsaved".
- [ ] The "Leave" button in the alert closes the editing dialog without saving, and the session keeps its original name.
- [ ] After clicking "Leave", no dialog is visible anymore and the original name of the session is visible in the list.
