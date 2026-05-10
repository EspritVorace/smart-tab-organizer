# User Stories - Domain N: Notifications with Undo action

> Behaviors identified in the source code (`src/utils/notifications.ts`,
> `src/background/grouping.ts`, `src/background/deduplication.ts`,
> `src/utils/deduplicationSkip.ts`) and not covered by existing US
> (US-S001->S011, US-E001->E005, US-P001->P009, US-PO001->PO005,
> US-W001->W003, US-O001->O004, US-G001->G010, US-D001->D007,
> US-C001->C005, US-AS001->AS003).

---

## US-N001 - Grouping notification with Undo button

**As a** user whose tabs have just been grouped automatically,
**I want** to receive a native notification with an "Undo" button,
**so that** I can immediately undo the grouping if it was not desired.

### Acceptance criteria

- [ ] After a tab group is created, a native browser notification is shown with:
  - the localized title (e.g. "Tabs Grouped" in English, "Onglets Regroupes" in French);
  - a message mentioning the group name (e.g. `Tabs grouped into "My Group"`).
- [ ] The notification contains a button whose label is localized: "Undo" (EN), "Annuler" (FR), "Deshacer" (ES).
- [ ] Clicking the Undo button immediately ungroups the tabs that had just been grouped (`browser.tabs.ungroup` on the relevant IDs).
- [ ] The notification automatically closes after **5 seconds** if the user does not interact.
- [ ] The notification is only shown if the `notifyOnGrouping` setting is **enabled** in the settings.
- [ ] If `notifyOnGrouping` is **disabled**, no notification appears after a grouping.

---

## US-N002 - Deduplication notification with Undo button

**As a** user whose duplicate tab has just been closed automatically,
**I want** to receive a native notification with an "Undo" button,
**so that** I can recover the closed tab if the closure was undesired.

### Acceptance criteria

- [ ] After a duplicate tab is closed, a native notification is shown with:
  - the localized title (e.g. "Duplicate Closed" / "Doublon Ferme");
  - a message mentioning the title of the closed tab (e.g. "Duplicate tab closed: GitHub").
- [ ] The notification contains an "Undo" / "Annuler" / "Deshacer" button (depending on the language).
- [ ] Clicking the Undo button reopens the closed tab in the **same window** as the original.
- [ ] The reopened tab becomes the **active** tab.
- [ ] The notification automatically closes after **5 seconds** if the user does not interact.
- [ ] The notification is only shown if the `notifyOnDeduplication` setting is **enabled**.
- [ ] If `notifyOnDeduplication` is **disabled**, no notification appears after a deduplication.

---

## US-N003 - Protection against re-deduplication after an Undo

**As a** user who has just reopened a tab via the Undo button,
**I want** that tab not to be immediately re-closed by deduplication,
**so that** I can use the recovered tab without it disappearing again.

### Acceptance criteria

- [ ] When a tab is reopened via the Undo action, its URL is marked to **skip deduplication** for **10 seconds**.
- [ ] During that 10-second window, if a second tab with the same URL is already open, the reopened tab is **kept** (not closed by deduplication).
- [ ] Beyond 10 seconds, the protection expires automatically and normal deduplication resumes for that URL.
- [ ] Expired entries in the protection list are cleaned up automatically.

---

## US-N004 - Cleanup of pending actions when the notification closes

**As the** extension service worker,
**I want** to clean up undo actions in memory when a notification closes,
**so that** I avoid memory leaks and ghost actions.

### Acceptance criteria

- [ ] Each notification is identified by a unique ID in the format `smarttab-{timestamp}`.
- [ ] The undo action associated with a notification is stored in memory (Map) for the lifetime of the notification.
- [ ] When the user closes the notification **without** clicking Undo (manual close or timeout), the corresponding entry is **removed** from the pending actions Map.
- [ ] After removal, it is no longer possible to execute the undo for that notification.

---

## US-N005 - Per-feature notification toggles

**As a** user,
**I want** to be able to enable or disable grouping and deduplication notifications independently,
**so that** I can control the level of interruption based on my preferences.

### Acceptance criteria

- [ ] A `notifyOnGrouping` setting (boolean) is available in the extension settings.
  - When `true`: a notification appears at each successful grouping.
  - When `false`: no grouping notification is emitted.
- [ ] A `notifyOnDeduplication` setting (boolean) is available in the settings.
  - When `true`: a notification appears at each duplicate closure.
  - When `false`: no deduplication notification is emitted.
- [ ] The two settings are independent: notifications can be enabled for grouping only, deduplication only, both, or neither.
