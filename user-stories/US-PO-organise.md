# User Stories - Domain PO: "Organize tabs" button

> Behaviors to be tested in `tests/e2e/popup-organize.spec.ts`.
> The US numbered below follow on from US-PO005.

---

## US-PO006 - "Organize tabs" button in the popup

**As a** user of the extension,
**I want** a button in the popup that triggers deduplication then grouping of all my open tabs,
**so that** I can organize all my existing tabs according to my configured rules in one click.

### Acceptance criteria

- [ ] The popup shows a button labeled "Organize tabs" (i18n key: `organizeAllTabs`) with the Lucide `Wand2` icon.
- [ ] The button is disabled (`disabled`) during the operation, with a visual loading indicator.
- [ ] Clicking the button closes the popup after triggering the operation (processing continues in the background).
- [ ] The button is always visible in the popup, even if the global grouping or deduplication toggles are disabled. The manual action is independent of the automatic toggles.

---

## US-PO007 - Manual global deduplication

**As a** user clicking on "Organize tabs",
**I want** all duplicate tabs (covered by active rules, and optionally those of domains without a rule) to be closed,
**so that** existing duplicates are eliminated before grouping.

### Acceptance criteria

- [ ] Tabs whose domain matches an **active** rule (`enabled = true`) with `deduplicationEnabled = true` are processed according to the rule's `deduplicationMatchMode`.
- [ ] Tabs whose domain **matches no rule** are processed in `exact` mode only if `deduplicateUnmatchedDomains = true`; otherwise they are ignored (consistent with US-D008).
- [ ] For each duplicate group (according to the matching mode of the rule involved), the kept tab is the one with the lowest `index` in the window (the leftmost).
- [ ] The kept tab is reloaded (`chrome.tabs.reload`).
- [ ] All deduplicated tabs are closed via `chrome.tabs.remove` in a single batch operation (single call with an array of IDs).
- [ ] The `tabsDeduplicatedCount` counter is incremented by the number of closed tabs.
- [ ] If at least one duplicate is found, a single Chrome notification is shown at the end indicating the total number of closed tabs (e.g. "3 duplicate tabs removed"), without an individual notification per tab. The notification is gated by `notifyOnOrganize` (see US-N006).
- [ ] If no duplicate is found AND no grouping change happens either, the noop notification described in US-N006 takes over.
- [ ] Tabs with special schemes (`chrome:`, `chrome-extension:`, `about:`) are ignored.

---

## US-PO008 - Manual global grouping

**As a** user clicking on "Organize tabs",
**I want** all open tabs whose domain matches an active rule to be grouped according to that rule,
**so that** I can organize into groups the existing tabs that have not yet been grouped.

### Acceptance criteria

**Planning phase (before any modification)**

- [ ] Grouping runs **after** deduplication (the tabs closed in the previous step are no longer present).
- [ ] Before any modification, a planning phase computes for each eligible tab its target group (name + rule). No tab is moved during this phase.
- [ ] Only tabs whose domain matches an **active** rule (`enabled = true`) with `groupingEnabled = true` are eligible.
- [ ] For each eligible tab, the target group name is computed according to `groupNameSource` and `titleParsingRegEx` / `urlParsingRegEx` of the matching rule (same logic as the existing automatic grouping).
- [ ] A target group whose plan contains only a single tab **not yet grouped** is dropped: the tab stays without a group.
- [ ] A tab already present in an existing Chrome group **before the Organize action**, and whose planned target group would have only one member, is left in its existing group without modification.

**Application phase**

- [ ] A tab already present in a Chrome group whose title matches the planned target group is not moved.
- [ ] A tab already in a group whose title **does not match** the planned target group is removed from its current group and placed in the correct group, provided that target group has at least two members in the plan.
- [ ] Tabs without a matching rule are not touched.
- [ ] Tabs with special schemes (`chrome:`, `chrome-extension:`, `about:`) are ignored.
- [ ] The `tabGroupsCreatedCount` counter is incremented only for newly created groups (not for already existing groups where tabs are simply added).

**Repositioning and collapse (active window only)**

- [ ] Once grouping is complete, all tab groups in the active window are moved to the leading positions (lowest indexes), before non-grouped tabs.
- [ ] The relative order of the groups among themselves is preserved (the group that was the leftmost remains the leftmost among the groups).
- [ ] All tab groups in the active window are collapsed (`collapsed: true`) via `chrome.tabGroups.update`.
- [ ] Non-grouped tabs are not moved (they end up after the groups).

**Notifications**

- [ ] If at least one tab was actually moved into a group, a single Chrome notification is shown at the end (e.g. "5 tabs grouped into 3 groups"). The notification is gated by `notifyOnOrganize` (see US-N006).
- [ ] If no tab was moved (plan empty, single-member targets, or every matching tab was already in its target group), the noop notification described in US-N006 takes over.

---

## US-PO009 - Existing automatic grouping behavior unchanged

**As a** user opening tabs normally (middle-click, right-click),
**I want** the automatic grouping behavior not to be affected by the new rules of the Organize action,
**so that** I keep my usual workflow intact.

### Acceptance criteria

- [ ] Automatic grouping (triggered when a tab is opened) does not check the number of members of the target group: a tab can be placed alone in a new group as before.
- [ ] Automatic grouping does not collapse and does not reposition existing groups.
