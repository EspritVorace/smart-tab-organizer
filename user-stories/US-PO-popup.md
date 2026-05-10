# User Stories - Domain PO: Popup (additions)

> Behaviors tested in `tests/e2e/popup.spec.ts` not covered by the existing US-PO001 to PO002.
> The US numbered below continue from US-PO003.

---

## US-PO003 - Deep linking: direct access to the Sessions section

**As a** user or developer of the extension,
**I want** to be able to access the Sessions section of the Options page directly via a URL hash,
**so that** I can navigate to the right section without additional interaction.

### Acceptance criteria

- [ ] Navigating to `options.html#sessions` directly shows the Sessions section (title or empty state visible).

---

## US-PO004 - Deep linking: automatic opening of the snapshot wizard

**As a** user clicking the "Save" button in the popup,
**I want** to be redirected to the Options page with the snapshot wizard already open,
**so that** I can start taking a snapshot in as few steps as possible.

### Acceptance criteria

- [ ] Navigating to `options.html#sessions?action=snapshot` automatically opens the "Save Session Snapshot" wizard dialog (dialog visible with this title).
- [ ] The "Save" button in the popup redirects to `options.html` with the `sessions` and `action=snapshot` parameters in the URL.

---

## US-PO005 - Conditional display of the Pinned sessions section in the popup

**As a** user of the popup,
**I want** the "Pinned sessions" section to appear only if there is at least one pinned session,
**so that** the popup stays concise when no session has been pinned.

### Acceptance criteria

- [ ] When no pinned session exists (only snapshots), the "Pinned sessions" section is **not** visible in the popup.
- [ ] When at least one pinned session exists, the "Pinned sessions" section and the session name are visible.
- [ ] All pinned sessions are listed in the section.
- [ ] Non-pinned sessions are **not** shown in the list.
- [ ] Each row has a quick-restore button ("Restore options") whose menu exposes the 4 options: `current`, `new`, `replace` ("Replace tabs in current window"), `customize`.
- [ ] The `replace` option replaces the non-pinned tabs of the active window with those of the chosen session and shows a "Session activated" system notification confirming the switch, then closes the popup.
