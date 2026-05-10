# US-DR-SEARCH: Search and highlighting in domain rules

## Context

The search bar in the Domain Rules section filters rules by **label** and
**domain filter**. The user does not always know why a rule appears in the
results when typing a term.

---

## User Stories

### US-DR-SEARCH-01: Filtering by label

**As a** user managing many domain rules,
**I want** the search bar to filter rules whose **label** contains the
searched term,
**so that** I can quickly find a rule by its name.

**Acceptance criteria:**
- Typing a term matching the label of a rule makes that rule appear in the
  filtered list.
- Rules whose label does not match are hidden.
- The search is case- and accent-insensitive.
- The part of the label matching the term is **highlighted** (component
  `AccessibleHighlight`) in the badge shown on the card.
- The label is also highlighted in the detail HoverCard header.

---

### US-DR-SEARCH-02: Filtering by domain filter

**As a** user,
**I want** the search bar to find rules whose **domain filter** contains the
searched term,
**so that** I can find a rule from a known domain or pattern.

**Acceptance criteria:**
- Typing a term matching the domain filter of a rule makes that rule appear
  in the filtered list.
- Rules whose domain filter does not match are hidden.
- The search is case- and accent-insensitive.
- The part of the domain filter matching the term is **highlighted** in the
  filter text shown on the card.
- The domain filter is also highlighted in the detail HoverCard (field
  "Domain filter").

---

### US-DR-SEARCH-03: Highlighting matches

**As a** user searching in domain rules,
**I want** the parts of the text matching the searched term to be visually
highlighted,
**so that** I immediately understand why a result appears.

**Acceptance criteria:**
- The searched term is **highlighted** (yellow background, bold text) in the
  following fields when they match:
  - Rule label (badge on the card and HoverCard header)
  - Domain filter (text on the card and HoverCard field)
- The highlighting uses the `AccessibleHighlight` component (includes
  accessible `sr-only` markers for screen readers).
- When no search term is provided, no highlighting is displayed.
- The highlighting is case- and accent-insensitive (consistent with the
  filtering).

---

## Business rules

| Search field | Filtering | Highlight on the card | Highlight in the HoverCard |
|---|---|---|---|
| `rule.label` | Yes | Badge (label) | Header (label) |
| `rule.domainFilter` | Yes | Filter text | "Domain filter" field |

---

## Search field

The search applies to the following fields for each rule:

1. `rule.label`: Rule name/label
2. `rule.domainFilter`: Domain filter (e.g. `*.github.com`)

The comparison is always case- and accent-insensitive (via `foldAccents()`).

---

## Out of scope

- Search in other fields (title regex, URL regex, preset ID, etc.).
- Highlighting in HoverCard fields outside of the search (regex, deduplication, etc.).
