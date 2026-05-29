# User Stories - Domain S: Sessions (additions)

> Behaviors tested in `tests/e2e/sessions.spec.ts` not covered by the existing US-S001 to S008.
> The US numbered below continue from US-S009.

---

## US-S010 - Toolbar and search field

**As a** user on the Sessions page,
**I want** a search field and the action buttons in a toolbar at the top of the list,
**so that** I can quickly filter my sessions and trigger an action without hunting for controls.

### Acceptance criteria

- [ ] A search field (magnifier icon) is shown at the top of the Sessions page, on the left of the toolbar.
- [ ] Typing text in this field filters the session list in real time by name match (case-insensitive).
- [ ] The "Take Snapshot" button is shown to the right of the search field in the same toolbar.
- [ ] If there are no sessions, the empty state area shows the message "No saved sessions.".
- [ ] The "Take Snapshot" button is also visible in the empty state area.
- [ ] During the search, both sections (pinned / normal, cf. US-S020) remain visible but only show the matching sessions. A section without results is hidden.

---

## US-S011 - Restore options in the actions menu

**As a** user,
**I want** to be able to restore a session in different ways from the session card,
**so that** I can quickly choose where the tabs are opened without going through the full wizard.

### Acceptance criteria

- [ ] Each session card shows a "More actions" button (... icon) giving access to a dropdown menu.
- [ ] This menu offers at least the restore options: "Restore in current window", "Restore in new window", "Replace tabs in current window", "Customized restoration...".
- [ ] The "Restore in current window" option restores the tabs and shows a success confirmation message (e.g. "X tab(s) opened").
- [ ] The "Replace tabs in current window" option closes the non-pinned tabs of the active window (keeping the host tab of the options page if the action starts from it) then restores the session tabs. A "Session activated" system notification confirms the switch.
- [ ] The "Customized restoration..." option opens the restore wizard (a `role="dialog"` containing a "Restore" text).

> **Design note (v1.1+):** The dedicated split button has been replaced with the "More actions" menu to reduce visual clutter. Session metadata (dates, note) is accessible via a HoverCard on the session name.

---

## US-S012 - Conflict analysis before restoring in the current window

**As a** user,
**I want** the extension to automatically detect conflicts between the session to restore and the tabs/groups already open,
**so that** I am offered resolution options before opening anything.

### Acceptance criteria

- [ ] When the chosen destination is "Current window", the extension analyzes the currently open tabs and groups before showing the resolution step.
- [ ] A **duplicate tab** is detected by exact URL match with a tab already open in the window.
- [ ] A **conflicting group** is detected when an existing group in the window has exactly the same title (case-insensitive) **and** the same color as a group to restore.
- [ ] If no conflict is detected, the resolution step is skipped: the wizard goes directly to confirmation (2 steps instead of 3).
- [ ] If at least one conflict is detected, an intermediate resolution step is inserted (3 steps total).
- [ ] Choosing "New window" as the destination skips conflict analysis and goes directly to confirmation.
- [ ] Choosing "Replace tabs in current window" as the destination also skips conflict analysis and goes directly to execution (no resolution step): non-pinned and non-protected tabs are closed after the new ones are created.

---

## US-S013 - Global resolution of duplicate tabs

**As a** user,
**I want** to choose a global action for all tabs already open detected as duplicates,
**so that** I can control whether these tabs are reopened or skipped during restore.

### Acceptance criteria

- [ ] The resolution step shows the list of duplicate tabs (title + URL) with a warning icon and an "Already Open" badge.
- [ ] Two global options are offered (radio buttons):
  - **Do not restore duplicates** (default): tabs already open are not recreated.
  - **Open anyway**: duplicate tabs are opened in addition to the existing tabs.
- [ ] The same option applies to **all** duplicate tabs.

---

## US-S014 - Per-group resolution of group conflicts

**As a** user,
**I want** to independently choose for each conflicting group how to handle it,
**so that** I can apply the most appropriate strategy group by group.

### Acceptance criteria

- [ ] Each conflicting group is shown with its color, its title, and the number of tabs it contains.
- [ ] Three actions are available for each group (dropdown menu):
  - **Merge** (default): the tabs to restore are added to the existing group; tabs already in this group are not duplicated.
  - **Create a new group**: a new separate group is created, independently of the existing group.
  - **Ignore**: the group and its tabs are not restored.
- [ ] The decision made for one group does not affect the others.

---

## US-S015 - Confirmation, execution, and restore metrics

**As a** user,
**I want** to see a recap of what will be restored before validating, then a numerical report after the operation,
**so that** I can confirm the restore knowingly and verify the result.

### Acceptance criteria

- [ ] The confirmation step indicates the destination (current window or new window) and the number of tabs that will be opened.
- [ ] If duplicates are skipped, the number of skipped tabs is indicated in the confirmation step.
- [ ] After the restore, the dialog closes automatically.
- [ ] A system notification appears with the title "Session restored" and a message stating the number of opened tabs and skipped duplicates (e.g. "5 tab(s) opened, 2 duplicate(s) skipped").
- [ ] If errors occur during the restore, an error notification is shown instead.
- [ ] After a "Replace tabs in current window" restore, an additional system notification (title "Session activated", message `Switched to session "{name}"`) confirms the context switch.

---

## US-S016: Capture of the collapsed/expanded state of tab groups

**As a** user taking a snapshot of their tabs,
**I want** the collapsed or expanded state of each Chrome tab group to be saved automatically,
**so that** the snapshot faithfully reflects my window layout at save time.

### Acceptance criteria

- [ ] When a Chrome group is collapsed at the time of the snapshot, the saved session contains `collapsed: true` for that group.
- [ ] When a Chrome group is expanded at the time of the snapshot, the saved session contains `collapsed: false` for that group.
- [ ] Existing sessions without the `collapsed` field continue to work normally (backward compatibility): they are processed as if all groups were expanded.

---

## US-S017: Restoring the collapsed/expanded state of tab groups

**As a** user restoring a session,
**I want** tab groups to be recreated with their original collapsed or expanded state,
**so that** I find again exactly the layout I had saved.

### Acceptance criteria

- [ ] When restoring in a new window, a group marked `collapsed: true` is created collapsed in Chrome.
- [ ] When restoring in the current window (creating a new group), the group respects the saved `collapsed` state.
- [ ] When merging into an existing group, the collapsed/expanded state of the existing group is not modified.
- [ ] Sessions without the `collapsed` field restore groups as expanded (default behavior).

---

## US-S018: Editing the collapsed/expanded state in the session editor

**As a** user editing a session,
**I want** the editor to display groups according to their saved collapsed/expanded state and for changes to that state to be persisted on save,
**so that** I can adjust the layout of groups before a restore.

### Acceptance criteria

- [ ] When the editor opens, a group with `collapsed: true` is shown collapsed (its child tabs are not visible).
- [ ] When the editor opens, a group without the `collapsed` field or with `collapsed: false` is shown expanded (its child tabs are visible).
- [ ] Collapsing or expanding a group in the editor counts as a modification (the "Save" button becomes enabled).
- [ ] After save, the `collapsed` value of each group is updated in storage.

---

## US-S019: Redesigned session card (HoverCard and inline rename)

**As a** user on the Sessions page,
**I want** to view a session's metadata (creation and modification dates, note) and rename a session directly on its card,
**so that** I can access useful information without opening the editor and quickly rename a session.

### Acceptance criteria

**HoverCard metadata:**
- [ ] The session name in the card is a HoverCard trigger (Radix `HoverCard.Root`).
- [ ] On hover, the HoverCard shows: session name, creation date, last modification date.
- [ ] If the session has a note, it is also shown in the HoverCard.
- [ ] The HoverCard does not block interactions with the card (it closes when the cursor moves away).

**Inline rename:**
- [ ] A pencil button (`Pencil` icon) is shown between the session name and the category badge.
- [ ] On click of the pencil, the session name becomes an editable text field.
- [ ] The field is confirmed via the Enter key or a confirm button (`Check` icon).
- [ ] The field is cancelled via the Esc key or a cancel button (`X` icon).
- [ ] A duplicate name (case-insensitive) shows an error message under the field.
- [ ] An empty name is not accepted.

**Consolidated actions menu:**
- [ ] The actions menu (`...`) groups all actions: restore (current window, new window, customized), edit, move to first/last in the group (cf. US-S-DND), pin/unpin, delete.

---

## US-S020: Separation of pinned and normal sessions

**As a** user on the Sessions page,
**I want** pinned sessions to be shown in a separate section above normal sessions,
**so that** I can visually distinguish my profiles (pinned sessions) from my classic snapshots.

### Acceptance criteria

**Visual sections:**
- [ ] The Sessions page shows two distinct sections: "Pinned Sessions" (at the top) and "Sessions" (at the bottom), separated by a `Separator`.
- [ ] Each section has a non-collapsible header with an icon (`Pin` for pinned, `Archive` for normal), an i18n title, and a counter (`Badge`).
- [ ] The sections are not collapsible (no `Collapsible`).

**Empty states:**
- [ ] If no pinned session exists, the "Pinned Sessions" section shows a contextual help message (e.g. "No pinned sessions. Pin a session for quick popup access.").
- [ ] If all sessions are pinned, the "Sessions" section shows a help message (e.g. "All sessions are pinned.").
- [ ] If no session exists at all, the existing global empty state is shown (Archive icon + "Take Snapshot" button) without section headers.

**Intra-group drag-and-drop:**
- [ ] Each section has its own independent `DragDropProvider`.
- [ ] Drag-and-drop only works inside a section (no inter-section moves).
- [ ] To change the pinned status of a session, the user uses the pin/unpin button on the card, which moves the session into the right section.

**"Move to first" / "Move to last" within the group:**
- [ ] The "Move to first" and "Move to last" actions in the actions menu operate within the session's group (pinned or normal), not within the global list.

**Search:**
- [ ] During the search, both sections remain visible but only show the matching sessions.
- [ ] A section without results is hidden during the search.
- [ ] Drag-and-drop stays disabled during the search.

---

## US-S021: Replacing the tabs of the current window to switch context

**As a** user,
**I want** to be able to replace the tabs of the active window with those of a chosen session,
**so that** I can quickly switch work context without accumulating tabs from other activities.

### Acceptance criteria

- [ ] A 4th "Replace tabs in current window" option is available in the `SessionRestoreButton` menu (session card and popup).
- [ ] A 3rd "Replace tabs in current window" radio is available in the customized restore wizard, after "In the current window" and "In a new window".
- [ ] Execution of the "Replace" mode:
  - Closes all **non-pinned** tabs of the active window.
  - Keeps the **pinned** tabs (`tab.pinned === true`).
  - Keeps the host tab of the options page when the action is triggered from it (session card or wizard).
  - Closes the pre-existing tabs **after** the session tabs are created to avoid the window being empty.
- [ ] From the popup, all non-pinned tabs are replaced (since the popup is not a tab, there is no host tab to protect).
- [ ] The "Replace" mode in the wizard skips the conflict resolution step.
- [ ] A system notification (title "Session activated", message `Switched to session "{name}"`) confirms the switch after the restore.
- [ ] Automatic deduplication is neutralized for the duration of the restore (cf. corresponding US-D): if a kept pinned tab shares a URL with a session tab, both tabs coexist.
- [ ] From the popup, the popup automatically closes after triggering the replacement.

## US-S022: Choice of the default action for the Restore button

**As a** user,
**I want** to choose which restore action is triggered by the primary Restore button (among: current window, new window, replace, customize),
**so that** I can trigger the action I use most often in one click without going through the dropdown menu.

### Acceptance criteria

- [ ] A new `defaultRestoreAction` field is added to `AppSettings`, with possible values `current`, `new`, `replace`, `customize`. Default value is `current`, preserving prior behavior.
- [ ] The setting is persisted in `browser.storage.local`, scoped per workspace, through the existing pipeline (`getSettings`, `setSettings`, `updateSettings`, `useSettings`, `getActiveScopedItems`, `WORKSPACE_SCOPED_KEYS`), and included in the workspace import/export payload.
- [ ] Clicking the primary (left) part of the `SessionRestoreButton` triggers the action matching `defaultRestoreAction`. When the value is `customize`, the primary click opens the customized restore flow.
- [ ] The `aria-label` of the primary part reflects the current action.
- [ ] The dropdown menu keeps its 4 clickable actions (immediate execution) with their `data-testid` and shortcuts unchanged. Below them, a `Separator` and a `RadioGroup` titled "Default action" list the same 4 options; the radio matching `defaultRestoreAction` is announced as selected, and picking a radio updates the setting without triggering any restoration.
- [ ] Each `RadioItem` of the menu carries a stable `data-testid` of the form `session-restore-default-{current|new|replace|customize}`.
- [ ] The Settings page exposes a `RadioGroup` titled "Default action" with a localized label and description, allowing the user to change `defaultRestoreAction` outside any session card. Changes made there are reflected on all session cards (and vice versa) without manual reload.
- [ ] The Sessions page, the popup (`PopupProfilesList`) and the HomePage pinned tiles all respect `defaultRestoreAction` for the primary click. The Sessions page, the popup and the pinned tiles also expose the `RadioGroup` in their dropdown so the default can be changed in place; the HomePage tiles map `customize` to the existing `custom` `HomeRestoreTarget` without introducing a new value.
- [ ] All strings (group label, description) exist in `fr`, `en` and `es`. Existing keys (`sessionRestoreCurrentWindow`, etc.) are reused for the per-option labels.
- [ ] The keyboard shortcuts of the 4 menu actions (Shift+R, Alt+Shift+R, Alt+R, R) remain attached to those entries and continue to trigger their specific action regardless of `defaultRestoreAction`.
