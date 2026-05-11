# User Stories: Domain PO: Saving the active tab group

> Behaviors covered by `tests/e2e/popup-save-group.spec.ts` and `tests/tabCapture.test.ts`.
> The US numbered below continue from US-PO006.

---

## US-PO006: Contextual Save button in the popup

**As a** user of the popup,
**I want** a single Save button whose action adapts to the context of the active tab,
**so that** I can save the most relevant scope in one click without having to pick from a menu.

### Acceptance criteria

- [ ] The Save button stays a simple button (camera icon + "Save" text) in all cases: no chevron, no dropdown menu, no SplitButton.
- [ ] When the active tab **does not belong** to a Chrome group, clicking Save opens the SnapshotWizard with all tabs of the window pre-checked (deep link `#sessions?action=snapshot`).
- [ ] When the active tab **belongs to a Chrome group**, clicking Save opens the SnapshotWizard with only the tabs of that group pre-checked (deep link `#sessions?action=snapshot&groupId=<id>`).
- [ ] When the button is disabled (`canSave = false`), clicking does not trigger any action.
- [ ] The `aria-label` reflects the contextual action:
  - outside a group: "Save session" (key `popupSaveSession`),
  - inside a group: "Save active tab group" (key `popupSaveActiveGroup`).

---

## US-PO007: Saving the active tab group

**As a** user whose active tab belongs to a Chrome group,
**I want** the Save button to save only that group and inform me of this modifiable restriction,
**so that** I can quickly create a dedicated session without fearing an unwanted incomplete selection.

### Acceptance criteria

- [ ] Clicking Save (or directly opening the deep link `#sessions?action=snapshot&groupId=<id>`) opens the SnapshotWizard.
- [ ] The SnapshotWizard opens with **only the tabs of the active group pre-checked**; other tabs (outside the group or from other groups) are not checked.
- [ ] The pre-selection is **modifiable**: the user can freely check or uncheck any tab.
- [ ] The **default session name** is the title of the Chrome group (e.g. "Work").
- [ ] If the group **has no title** (unnamed group), the default name is "Snapshot \<date\>" (usual behavior).
- [ ] If the `groupId` passed as a parameter does not match any captured group (group deleted in the meantime), the SnapshotWizard opens with all tabs pre-checked (usual fallback) and without the callout.

### Information callout

- [ ] When the SnapshotWizard is opened with a pre-selection coming from an identified active group and that pre-selection is strictly partial (at least one tab of the window is not pre-checked), an information callout appears at the top of the wizard (`data-testid="wizard-snapshot-group-callout"`) signaling that the selection is restricted to the active group and remains extensible.
- [ ] If all tabs of the window are already pre-checked (the window contains only the active group), the callout is not shown.
- [ ] If the user extends the selection to all tabs after opening, the callout disappears (full selection).
- [ ] If no `groupId` is passed ("save all" classic path), the callout is not shown.
- [ ] If the `groupId` is invalid (group gone), the callout is not shown.

### Business rules

| Situation | Callout | Default session name | Pre-checked tabs |
|---|---|---|---|
| Window = active group only | No | Group title (or "Snapshot \<date\>") | All (= group) |
| Window = active group + tabs outside the group | Yes | Group title (or "Snapshot \<date\>") | Tabs of the group |
| Window = multiple groups | Yes | Title of the active group (or "Snapshot \<date\>") | Tabs of the active group |
| No active group ("save all" path) | No | "Snapshot \<date\>" | All |
| Unknown `groupId` at capture time | No | "Snapshot \<date\>" | All |
