# User Stories - Domain D: Automatic tab deduplication

> Behaviors tested in `tests/e2e/deduplication.spec.ts` not covered by existing US (US-S001->S008, US-E001->E002, US-P001->P004, US-PO001->PO002, US-W001, US-O001).

---

## US-D001 - Global deduplication toggle

**As a** user of the extension,
**I want** to be able to enable or disable automatic deduplication globally,
**so that** I can control whether duplicate tabs are closed automatically.

### Acceptance criteria

- [ ] When global deduplication is **enabled**, opening a tab with an already open URL keeps a single tab according to the configured strategy (see US-D009) and closes the other.
- [ ] When global deduplication is **disabled**, duplicate tabs are kept; `tabsDeduplicatedCount` stays at 0.
- [ ] Two tabs with **different URLs** are never deduplicated, even if global deduplication is enabled.
- [ ] The `tabsDeduplicatedCount` counter is incremented only when a deduplication occurs.

---

## US-D002 - Per-rule deduplication settings

**As a** user,
**I want** each domain rule to be able to enable or disable deduplication independently of the global setting,
**so that** I can finely manage domains where duplicates are desirable.

### Acceptance criteria

- [ ] When a rule has `deduplicationEnabled = true`, duplicate tabs of the matching domain are removed.
- [ ] When a rule has `deduplicationEnabled = false`, duplicates of the matching domain are kept, even if global is enabled.
- [ ] When a rule is **disabled** (`enabled = false`), it is ignored and the global setting applies to that domain.

---

## US-D003 - Matching mode: exact

**As a** user,
**I want** to be able to configure deduplication in "exact" mode,
**so that** a tab is closed only if it points to exactly the same URL.

### Acceptance criteria

- [ ] In `exact` mode, two identical URLs (same protocol, domain, path, query string, fragment) are considered duplicates and one is closed.
- [ ] In `exact` mode, two URLs that differ **only by the query string** (`?param=a` vs `?param=b`) are considered distinct and kept.
- [ ] In `exact` mode, two URLs that differ **only by the fragment** (`#section1` vs `#section2`) are considered distinct and kept.
- [ ] A tab with the same fragment as an existing tab is correctly deduplicated (`#section1` vs `#section1`).

---

## US-D004 - Matching mode: includes

**As a** user,
**I want** to be able to configure deduplication in "includes" mode,
**so that** a tab is closed if its URL is contained in an already open URL (or vice versa).

### Acceptance criteria

- [ ] In `includes` mode, if the new tab's URL is a **substring** of an existing tab's URL, the new tab is considered a duplicate and closed.
  - Example: `/products/item` is contained in `/products/item/123` -> deduplicated.
- [ ] In `includes` mode, two URLs without a substring relationship (e.g. `/products` and `/about`) are **not** deduplicated.

---

## US-D005 - Multiple rules and domains without rules

**As a** user,
**I want** each domain to follow its own deduplication rule,
**so that** I can maintain different behaviors per site.

### Acceptance criteria

- [ ] A domain with a rule `deduplicationEnabled = true` has its duplicates removed.
- [ ] A domain with a rule `deduplicationEnabled = false` keeps its duplicates, even if global is enabled.
- [ ] A domain **without a rule** follows the `deduplicateUnmatchedDomains` setting as long as global deduplication is enabled (see US-D008).

---

## US-D006 - Deduplication edge cases

**As a** developer of the extension,
**I want** deduplication to be robust against edge cases,
**so that** I can guarantee the stability of the extension in all scenarios.

### Acceptance criteria

- [ ] Tabs with special schemes (`about:`, `chrome:`, `chrome-extension:`) do not cause a crash and are ignored by deduplication.
- [ ] When several duplicate tabs are created quickly in parallel, at least some are deduplicated (`tabsDeduplicatedCount > 0`).
- [ ] A domain filter targeting a subdomain (e.g. `www.example.com`) correctly matches URLs of that subdomain.

---

## US-D007 - Deduplication statistics

**As a** user,
**I want** the deduplication counter to accurately reflect the number of closed tabs,
**so that** I can measure the usefulness of the feature.

### Acceptance criteria

- [ ] `tabsDeduplicatedCount` starts at 0 after a statistics reset.
- [ ] The counter is incremented by exactly **1** each time a duplicate tab is closed.
- [ ] After two successive deduplications for the same URL, the counter is 2.

---

## US-D008 - Deduplication scope for domains without a rule

**As a** user,
**I want** to choose from the Options page whether automatic deduplication applies to tabs from sites that do not match any domain rule,
**so that** I can limit deduplication to the domains I have explicitly configured.

### Acceptance criteria

- [ ] A `deduplicateUnmatchedDomains` (boolean) setting is exposed in the Options page, in a section dedicated to deduplication scope.
- [ ] The default value is `false`: domains without a rule are not deduplicated automatically until the user enables the setting.
- [ ] When `deduplicateUnmatchedDomains = false` and global deduplication is enabled, tabs from a domain without a rule are **not** deduplicated; `tabsDeduplicatedCount` remains unchanged for these URLs.
- [ ] When `deduplicateUnmatchedDomains = false`, a domain rule with `deduplicationEnabled = true` continues to deduplicate its tabs (the rule prevails).
- [ ] When global deduplication is disabled, the `deduplicateUnmatchedDomains` setting has no effect (the global kill-switch remains priority).
- [ ] The UI label states the scope: applies only to sites without a domain rule, and rules remain priority.

---

## US-D009 - "Which tab to keep on deduplication" strategy

**As a** user,
**I want** to choose which tab survives when a duplicate is detected,
**so that** I can preserve state or group membership according to my needs.

### Context

Historically, deduplication always kept the existing tab (the older one) and closed the new tab. This behavior is problematic during a session restore: if the saved session contains a **grouped** tab at URL X and an **ungrouped** tab is already open at this URL, the ungrouped tab survives and membership in the restored group is lost.

### Acceptance criteria

- [ ] A `deduplicationKeepStrategy` setting is exposed in the Options page, "Deduplication scope" section, as a radio with four values:
  - `keep-old`: keep the existing tab.
  - `keep-new`: keep the new tab and close the existing one.
  - `keep-grouped`: keep the one that is in a group, otherwise fall back to `keep-old`.
  - `keep-grouped-or-new`: keep the one that is in a group, otherwise fall back to `keep-new`.
- [ ] The default value is `keep-grouped-or-new`: the grouped tab is always protected, and when the heuristic does not decide (neither or both tabs grouped) the freshly loaded version is preferred.
- [ ] The radio is visually disabled when global deduplication is off.
- [ ] In `keep-grouped` mode, if both tabs are grouped or neither, the older one is kept (explicit fallback).
- [ ] In `keep-new` mode, the closed tab captures its `groupId`, `title` and `index` before closing; the "Undo" action of the notification reopens the tab and tries to re-attach it to its original group (fallback: new group if the original no longer exists).
- [ ] When restoring a session containing a grouped tab at URL X, if an ungrouped tab at X already exists in the window and `deduplicationKeepStrategy = 'keep-grouped'`, the restored (grouped) tab survives and keeps its group membership.
- [ ] The `tabsDeduplicatedCount` counter is incremented exactly once per deduplication, regardless of the strategy.

---

## US-D - Neutralizing deduplication during session restore

**As a** user restoring a session,
**I want** automatic deduplication not to close the freshly created tabs from the restore,
**so that** I can fully recover the session content even when kept tabs (pinned, options page host tab) share a URL with a session tab.

### Context

The "Replace tabs in current window" mode keeps pinned tabs and possibly the host tab of the options page. Without a guard, the background's deduplication handler would close one of the two tabs sharing a URL (either the restored one or the kept one) as soon as they coexist in the window, causing the session to lose content or breaking the pinned reference.

### Acceptance criteria

- [ ] Before any tab creation via `restoreTabs` (`current`, `new` or `replace` targets), URLs from the session are sent to the background via a `SESSION_RESTORE_SKIP_DEDUP` message.
- [ ] The background handler calls `markUrlToSkipDeduplication` for each URL received. The 10s TTL of the skip-dedup registry covers the tab creation of a typical session.
- [ ] The deduplication handler (`src/background/deduplication.ts`) consults `shouldSkipDeduplication` before acting and does not operate on URLs in reprieve.
- [ ] Tested case: pinned tab at URL X + session also containing X. After "Replace tabs in current window", both tabs coexist in the window.
- [ ] Tested case: the options page stays open after "Replace" even if the session contains a URL identical to that of the options page.
