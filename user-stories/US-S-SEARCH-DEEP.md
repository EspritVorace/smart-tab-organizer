# US-S-SEARCH-01: Search in tab titles and URLs of a session

## Context

The search bar in the Sessions section currently filters only on the
**name** of the session. The user cannot find a session containing
a specific tab if they do not remember the name they gave the session.

---

## User Stories

### US-S-SEARCH-01: Search by tab title

**As a** user with many saved sessions,
**I want** the search bar to also find sessions whose tab has a title matching the searched term,
**so that** I can quickly find a session via the title of one of its tabs.

**Acceptance criteria:**
- Typing a term matching the title of a tab (grouped or not) makes the session appear in the filtered list.
- The expandable section (preview) of the session is **automatically opened**.
- Tab groups containing the matching tab are **expanded**.
- Groups without matches stay **collapsed**.
- The search is case- and accent-insensitive.
- The parts of the tab title matching the search term are **highlighted** (component `AccessibleHighlight`) in the open preview.

---

### US-S-SEARCH-02: Search by tab URL

**As a** user,
**I want** the search bar to find sessions whose tab has a URL containing the searched term,
**so that** I can find a session containing a particular domain or URL.

**Acceptance criteria:**
- Typing a term matching the URL of a tab (grouped or not) makes the session appear in the filtered list.
- The expandable section (preview) of the session is **automatically opened**.
- Tab groups containing the matching tab are **expanded**.
- The search is case- and accent-insensitive.
- The part of the displayed domain (extracted from the URL) matching the search term is **highlighted** in the open preview.

---

### US-S-SEARCH-03: Search by tab group title

**As a** user,
**I want** the search bar to find sessions whose tab group has a title matching the searched term,
**so that** I can find a session from the name of one of its groups.

**Acceptance criteria:**
- Typing a term matching the title of a group makes the session appear in the filtered list.
- The expandable section (preview) of the session is **automatically opened**.
- The group(s) whose title matches are **expanded**.
- The search is case- and accent-insensitive.
- The part of the group title matching the search term is **highlighted** in the open preview.

---

### US-S-SEARCH-06: Highlighting the session name and matching tabs

**As a** user searching in sessions,
**I want** the parts of the text matching the searched term to be visually highlighted in session cards,
**so that** I immediately understand why a result appears.

**Acceptance criteria:**
- The searched term is **highlighted** (yellow background, bold text) in the following fields when they match:
  - Session name (always visible on the card)
  - Group title (in the open preview)
  - Tab title (in the open preview)
  - Domain extracted from the tab URL (in the open preview)
- The highlighting uses the `AccessibleHighlight` component (includes accessible `sr-only` markers for screen readers).
- When no search term is provided, no highlighting is shown.
- The highlighting is case- and accent-insensitive (consistent with filtering).

---

### US-S-SEARCH-04: Match on the session name only

**As a** user,
**I want** the expandable section to remain **closed** when the search matches only the **name** of the session (without matches in tabs or groups),
**so that** I keep a compact view when the name alone is enough to identify the session.

**Acceptance criteria:**
- If the term matches the session name but not a tab title/URL or group title, the session is shown with its expandable section **closed**.
- The user can still open the expandable section manually.

---

### US-S-SEARCH-05: Non-blocking forced opening

**As a** user,
**I want** to be able to manually re-close the expandable section of a session whose preview was automatically opened by the search,
**so that** I keep control of the display even during an active search.

**Acceptance criteria:**
- When the preview is automatically opened (tab/group match), the user can click the trigger to close it.
- Clearing the search returns the cards to their initial state (preview closed, unless the user manually opened it before searching).

---

## Business rules

| Condition | Session preview | Groups |
|---|---|---|
| Match on name only | Closed (existing behavior) | N/A |
| Match on ungrouped tab | **Automatically opened** | N/A |
| Match on group title | **Automatically opened** | Matching groups **expanded** |
| Match on tab in a group | **Automatically opened** | Parent group **expanded** |
| Match on name AND tabs/groups | **Automatically opened** | Matching groups **expanded** |
| No match | Session hidden | N/A |

---

## Search field

The search applies to the following fields, for each session:

1. `session.name`: Session name
2. `group.title`: Title of each group
3. `tab.title`: Title of each tab (grouped and ungrouped)
4. `tab.url`: URL of each tab (grouped and ungrouped)

The comparison is always case- and accent-insensitive (via `foldAccents()`).

---

## Interaction with pinned/normal sections (cf. US-S020)

- The search filters sessions in both sections (pinned and normal) independently.
- Each section only shows the sessions matching the searched term.
- A section with no result is hidden during the search.
- Drag-and-drop stays disabled during the search in both sections.

---

## Out of scope

- Search in future descriptions or metadata of sessions.
