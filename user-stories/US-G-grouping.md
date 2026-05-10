# User Stories - Domain G: Automatic tab grouping

> Behaviors tested in `tests/e2e/grouping.spec.ts` not covered by existing US (US-S001->S008, US-E001->E002, US-P001->P004, US-PO001->PO002, US-W001, US-O001).

---

## US-G001 - Global grouping toggle

**As a** user of the extension,
**I want** to be able to enable or disable automatic grouping globally,
**so that** I can control whether my tabs are organized into groups when opening a link.

### Acceptance criteria

- [ ] When global grouping is **enabled** and a domain rule matches, a child tab opened from a parent tab is automatically placed into a group.
- [ ] When global grouping is **disabled**, no tab is grouped, even if a matching domain rule exists.
- [ ] When **no rule** matches the domain of the opened tab, no group is created.
- [ ] The `tabGroupsCreatedCount` counter in statistics stays at 0 when no group is created.

---

## US-G002 - Per-rule grouping settings

**As a** user,
**I want** each domain rule to enable or disable grouping independently of the global setting,
**so that** I can finely manage which domains deserve grouping.

### Acceptance criteria

- [ ] When a rule has `groupingEnabled = false`, tabs from the matching domain are **not** grouped, even if global grouping is enabled.
- [ ] When a rule is disabled (`enabled = false`), it is ignored and no group is created for that domain.

---

## US-G003 - Group name sources

**As a** user,
**I want** to choose how the name of a group is determined (label, URL, page title, or automatic),
**so that** I can customize the visual identification of my tab groups.

### Acceptance criteria

- [ ] `groupNameSource = label`: the group name is the **label** of the domain rule.
- [ ] `groupNameSource = url`: the group name is **extracted from the URL** of the parent tab via the regular expression `urlParsingRegEx`; on extraction failure, falls back to the label.
- [ ] `groupNameSource = title`: the group name is **extracted from the title** of the parent page via `titleParsingRegEx`; on extraction failure, falls back to the label.
- [ ] `groupNameSource = smart_label`: uses the same logic as `title` but falls back to the label if extraction fails.
- [ ] An **invalid** regular expression (syntactically incorrect) does not crash the extension; a group is still created with the label as fallback name.

---

## US-G004 - Group color

**As a** user,
**I want** to define the color of a group in the domain rule,
**so that** I can visually distinguish my groups in the tab bar.

### Acceptance criteria

- [ ] The color specified in the rule (`blue`, `red`, `green`, `purple`, etc.) is correctly applied to the group created by the browser.
- [ ] When no color is specified (`color = ""`), Chrome assigns its default color and the group is still created.

---

## US-G005 - Behavior with an existing group

**As a** user,
**I want** successive child tabs opened from the same parent tab to join the existing group,
**so that** I avoid the multiplication of redundant groups.

### Acceptance criteria

- [ ] A first child tab creates a new group; the `tabGroupsCreatedCount` counter goes to 1.
- [ ] A second child tab opened from the **same** parent tab is added to the existing group without creating a new one.
- [ ] The number of tabs in the group increases with each added child.
- [ ] A new (distinct) parent tab creates a **new** separate group; `tabGroupsCreatedCount` increments.

---

## US-G006 - Multiple rules and priority

**As a** user,
**I want** to define multiple domain rules so that the most specific one applies,
**so that** I have different behaviors based on the exact domain.

### Acceptance criteria

- [ ] When multiple rules exist, each domain uses the rule that matches it (e.g. `example.com` -> blue group, `httpbin.org` -> red group).
- [ ] In case of multiple matches for the same domain, the **first rule** in the list wins (e.g. `www.example.com` takes priority over `example.com`).
- [ ] Domains without a matching rule are not grouped.

---

## US-G007 - Grouping statistics

**As a** user,
**I want** the counter of created groups to faithfully reflect actual activity,
**so that** I can track the effectiveness of the extension.

### Acceptance criteria

- [ ] `tabGroupsCreatedCount` increments by 1 only when a **new** group is created.
- [ ] When a tab is added to an existing group, the counter **does not increment**.
- [ ] When a second group is created (different domain or new distinct parent tab), the counter reaches 2.

---

## US-G008 - Edge case: simultaneous openings

**As a** user,
**I want** the extension to correctly handle multiple child tabs opened simultaneously from the same parent,
**so that** I avoid creating duplicate groups.

### Acceptance criteria

- [ ] When three child tabs are created in parallel from the same parent tab, **only one** group is created (`tabGroupsCreatedCount = 1`).
- [ ] The resulting group contains at least two of the child tabs.

---

## US-G009 - Middle-click detection

**As a** user,
**I want** tabs opened by a middle-click on a link to be automatically grouped,
**so that** I can organize my tabs without manual action.

### Acceptance criteria

- [ ] The content script intercepts the `auxclick` event (button 1) on links and records the target URL in `middleClickedTabs`.
- [ ] When the child tab is then created with the right `openerTabId`, the background finds the entry in `middleClickedTabs` and creates the group.
- [ ] When a child tab is created with an `openerTabId` but **without** the content script having recorded a click (e.g. keyboard shortcut), no group is created.
- [ ] A second child tab opened naturally from the same parent joins the existing group.
- [ ] Disabling global grouping prevents group creation even via the natural path.

---

## US-G010 - Right-click detection (contextmenu)

**As a** user,
**I want** tabs opened via right-click -> "Open in a new tab" to also be grouped,
**so that** all the usual ways of opening a link are covered.

### Acceptance criteria

- [ ] The content script intercepts the `contextmenu` event on links and records the target URL in `middleClickedTabs`.
- [ ] When the user then opens a tab with that `openerTabId`, the group is created the same way as for middle-click.
- [ ] The created group receives the color and name defined in the matching domain rule.
