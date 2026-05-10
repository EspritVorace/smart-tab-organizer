# User Stories - Domain G: Group naming (additions US-G011 to US-G017)

> Behaviors identified in the source code (`src/background/grouping.ts`,
> `src/schemas/domainRule.ts`, `src/schemas/enums.ts`,
> `public/data/presets.json`) not covered by US-G003 nor by other existing US.
> The IDs continue the numbering of `US-G-grouping.md`
> (US-G001 to US-G010).

---

## US-G011 - Manual naming mode (`groupNameSource = manual`)

**As a** user,
**I want** to be prompted to enter the group name myself at each creation,
**so that** I can give it a precise name suited to my work context.

### Acceptance criteria

- [ ] When `groupNameSource = manual`, an input prompt is presented to the user immediately after the creation of a group.
- [ ] The **label** of the rule is offered as the default value in the prompt.
- [ ] If the user enters a name and confirms, the group is renamed with that name.
- [ ] If the user **cancels** the prompt (without entering a name), the tabs that had just been grouped are immediately **ungrouped**: the grouping operation is fully canceled.

---

## US-G012 - Smart mode with preset (`groupNameSource = smart`)

**As a** user,
**I want** the extension to automatically attempt to extract a name from the title then the URL of the parent tab using the regexes of the selected preset,
**so that** I get a contextual name without having to configure the regular expressions manually.

### Acceptance criteria

- [ ] In `smart` mode with a defined `presetId`, the extension first attempts extraction from the **title** of the parent tab via the preset's `titleParsingRegEx`.
- [ ] If title extraction fails (no match or invalid regex), the extension attempts extraction from the **URL** via `urlParsingRegEx`.
- [ ] If both extractions succeed, the value extracted from the title takes priority.
- [ ] If both extractions fail, the **label** of the rule is used as the group name.
- [ ] If `presetId` is missing (rule without preset), the extension falls back directly to the **label** with no extraction attempt.

---

## US-G013 - Smart mode with fallback prompt (`groupNameSource = smart_manual`)

**As a** user,
**I want** the extension to attempt automatic extraction and, if it fails, prompt me to enter the name manually,
**so that** I always have a relevant name even on sites that the regexes do not cover.

### Acceptance criteria

- [ ] In `smart_manual` mode, the extraction strategy is identical to `smart` (title, URL, failure).
- [ ] If extraction **succeeds**, the group is named automatically with the extracted value: no prompt is shown.
- [ ] If extraction **fails**, an input prompt is presented to the user (same behavior as `manual` mode).
- [ ] If the user cancels the prompt, the tabs are **ungrouped**.

---

## US-G014 - Smart mode with preset name as fallback (`groupNameSource = smart_preset`)

**As a** user,
**I want** the extension to use the name of the selected preset as a fallback when extraction fails,
**so that** I get a group name consistent with the type of site even without successful extraction.

### Acceptance criteria

- [ ] In `smart_preset` mode, extraction is attempted the same way as `smart` (title then URL via preset).
- [ ] If extraction **succeeds**, the extracted value is used as the group name.
- [ ] If extraction **fails** but a `presetId` is defined, the **preset name** (e.g. "GitHub: Issue") is used as the group name.
- [ ] If neither extraction nor the preset provides a name, the **label** of the rule is used as a last resort.

---

## US-G015 - Naming priority chain by mode

**As the** extension service worker,
**I want** each naming mode to follow a clearly defined fallback hierarchy,
**so that** I guarantee a group always receives a name, even in degraded cases.

### Acceptance criteria

| Mode | Priority |
|---|---|
| `label` | rule label, then `"SmartGroup"` |
| `url` | URL extraction, then title extraction, then **no grouping if failure** |
| `title` | title extraction, then URL extraction, then **no grouping if failure** |
| `smart_label` | extraction (title then URL), then label, then `"SmartGroup"` |
| `smart` | extraction (title then URL), then **no grouping if failure** |
| `smart_preset` | extraction, then preset name, then label, then `"SmartGroup"` |
| `smart_manual` | extraction, then user prompt, then ungroup if cancelled |
| `manual` | user prompt (label proposed), then ungroup if cancelled |

- [ ] The absolute last-resort name is `"SmartGroup"` (used when the label itself is empty): applies to modes with explicit fallback (`label`, `smart_label`, `smart_preset`).
- [ ] Modes without a fallback suffix (`title`, `url`, `smart`) do not group the tab if no extraction succeeds.
- [ ] A regex error (invalid syntax) is logged as a warning but does not prevent attempting the other sources: if all fail, the mode's behavior applies (no grouping for `title`/`url`/`smart`, fallback for the others).
- [ ] Extraction always uses the **first capture group** `(...)` of the regular expression.

---

## US-G016 - Built-in regex preset system

**As a** user configuring a domain rule,
**I want** to be able to select a preset from a list of predefined regexes for common sites,
**so that** I can quickly configure my rules without writing the regular expressions myself.

### Acceptance criteria

- [ ] **50 presets** are available, split into 10 categories:
  Generic, Development & Code, Productivity & Tickets, E-commerce, Travel & Bookings, Search & Documentation, Social Networks, Streaming & Media, Cloud & Infrastructure, Finance & Banking.
- [ ] Selecting a preset **auto-fills** `titleParsingRegEx` and `urlParsingRegEx` in the rule.
- [ ] Selecting a preset **automatically sets** `groupNameSource` according to the strategy recommended by that preset.
- [ ] Each preset exposes an `example` and `description` field to guide the user in the interface.
- [ ] When a `presetId` is set on the rule, the regex fields are **optional** (they are copied from the preset at processing time).

---

## US-G017 - Conditional validation of regex fields

**As a** user configuring a domain rule,
**I want** the required regex fields to be clearly flagged according to the chosen naming mode,
**so that** I avoid creating an incomplete or silently ineffective rule.

### Acceptance criteria

- [ ] In mode `groupNameSource = title` **without** `presetId`: `titleParsingRegEx` is **required**: a validation error is shown if the field is empty.
- [ ] In mode `groupNameSource = url` **without** `presetId`: `urlParsingRegEx` is **required**: same.
- [ ] In `manual` mode: no regex field is required.
- [ ] In `smart*` modes **with** `presetId`: the regex fields are optional (auto-filled from the preset).
- [ ] A syntactically invalid regex is reported with an error message (`errorInvalidRegex`).
- [ ] A regex **without a capture group** `(...)` is also invalid and reported with the same error.
