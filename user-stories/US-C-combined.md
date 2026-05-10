# User Stories - Domain C: Interactions between Grouping and Deduplication

> Behaviors tested in `tests/e2e/combined.spec.ts` not covered by existing US (US-S001->S008, US-E001->E002, US-P001->P004, US-PO001->PO002, US-W001, US-O001).

---

## US-C001 - Grouping and deduplication enabled simultaneously

**As a** user,
**I want** grouping and deduplication to work together consistently,
**so that** I have both tabs organized into groups and without duplicates.

### Acceptance criteria

- [ ] When both features are enabled on a rule, a child tab is first grouped with its parent, and a later duplicate of that tab is deduplicated.
- [ ] When a duplicate of a tab is created, it is **deduplicated before** being potentially grouped (deduplication takes priority).
- [ ] Statistics correctly reflect both operations: `tabGroupsCreatedCount` increases when a group is created, `tabsDeduplicatedCount` increases when a deduplication occurs.

---

## US-C002 - Independent settings per feature within the same rule

**As a** user,
**I want** to be able to enable one feature without the other on the same domain rule,
**so that** I can finely customize behavior for each site.

### Acceptance criteria

- [ ] When `groupingEnabled = true` and `deduplicationEnabled = false`: child tabs are grouped, duplicates are kept (`tabGroupsCreatedCount = 1`, `tabsDeduplicatedCount = 0`).
- [ ] When `groupingEnabled = false` and `deduplicationEnabled = true`: duplicates are removed, no group is created (`tabGroupsCreatedCount = 0`, group count = 0, `tabsDeduplicatedCount > 0`).

---

## US-C003 - Multiple rules with mixed settings

**As a** user,
**I want** each domain to follow its own grouping and deduplication settings,
**so that** I can manage multiple sites with different behaviors in a single configuration.

### Acceptance criteria

- [ ] Domain A (rule: group only) has its tabs grouped but not deduplicated.
- [ ] Domain B (rule: dedup only) has its duplicates removed but no group created.
- [ ] The statistics of each feature reflect only the actions that occurred on the relevant domains.

---

## US-C004 - Rule priority over global setting

**As a** user,
**I want** a domain rule to override global settings for that domain,
**so that** I have explicit exceptions to global behaviors.

### Acceptance criteria

- [ ] When both features are enabled globally but a rule disables both for a domain (`groupingEnabled = false`, `deduplicationEnabled = false`), no action is performed on that domain (`tabGroupsCreatedCount = 0`, `tabsDeduplicatedCount = 0`).
- [ ] A domain **without a matching rule** uses global settings (e.g. if global is enabled, duplicates of that domain are deduplicated).

---

## US-C005 - Complex navigation scenarios

**As a** user,
**I want** the extension to correctly handle multi-domain and multi-project navigation workflows,
**so that** I stay efficient in my real use cases.

### Acceptance criteria

- [ ] **GitHub navigation simulation**: tabs from the same repository (README, source files) are grouped into a single group; opening a duplicate tab (e.g. README already open) triggers a deduplication.
  - Expected result: 1 group created, at least 1 deduplication, exactly 1 visible group.
- [ ] **Two distinct projects**: each project generates its own group (named after the identifier extracted from the URL via regex). Two distinct openers create two distinct groups (`tabGroupsCreatedCount = 2`, visible group count = 2).
