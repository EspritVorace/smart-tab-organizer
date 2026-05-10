# US-S-NOTE: Session notes

## Context

Sessions allow saving a tab state for later restoration.
However, the user has no way to annotate a session to explain its context: why it was created, what it covers, what is left to do, etc.

Adding a **free-form note** field (multiline text) to each session allows contextualizing sessions and finding them more easily by their textual content.

---

## User Stories

### US-S-NOTE-01: Adding a note when creating a snapshot

**As a** user taking a snapshot of their tabs,
**I want** to be able to write an optional note before saving the session,
**so that** I can immediately document the context of this capture.

**Acceptance criteria:**
- The snapshot wizard exposes a `TextArea` field (Radix, vertically resizable)
  labeled **"Note"**, below the tab selection.
- The field is optional: leaving the field empty does not block saving.
- The entered note is persisted in the created session.
- When the wizard opens, the field is empty.

---

### US-S-NOTE-02: Modifying the note via the editing dialog

**As a** user editing an existing session,
**I want** to be able to read, modify, or remove the associated note,
**so that** I can keep an annotation up to date over time.

**Acceptance criteria:**
- The session editing dialog exposes a `TextArea` (Radix, vertically resizable)
  labeled **"Note"**, below the tab editor.
- The initial value of the field is the existing note (empty if no note).
- Any modification to the note marks the dialog as **dirty** (the "unsaved changes" confirmation dialog appears if the user tries to close without saving).
- The modified note is persisted after clicking **Save**.
- Fully clearing the field removes the note from the session.

---

### US-S-NOTE-03: Display of the note in the expanded session card

**As a** user browsing the list of sessions,
**I want** to see a session's note when I expand its card,
**so that** I can quickly understand the session context without opening it.

**Acceptance criteria:**
- The note appears **below the tab preview** in the expandable section of the card.
- It is only visible when the card is expanded.
- If the session has no note, no note area is shown.
- Line breaks in the note are respected on display (`white-space: pre-wrap`).

---

### US-S-NOTE-04: Search finds text in the note

**As a** user searching in sessions,
**I want** the search bar to also find sessions whose note contains the searched term,
**so that** I can find a session via an annotation I had left on it.

**Acceptance criteria:**
- Typing a term contained in a session's note makes that session appear in the filtered list.
- The expandable section (preview) of the session is **automatically opened**
  (same behavior as when a tab matches).
- The search is case- and accent-insensitive.
- If only the note matches (neither name nor tabs), the card still opens.

---

### US-S-NOTE-05: Highlighting the matching text in the note

**As a** user performing a search,
**I want** the part of the note matching the search term to be visually highlighted,
**so that** I can instantly see why the session appears in the results.

**Acceptance criteria:**
- The searched term is **highlighted** (yellow background, bold text) in the note text shown in the expanded card.
- The highlighting uses the `AccessibleHighlight` component (with `sr-only` markers included).
- When no search term is provided, no highlighting is shown.
- The highlighting is case- and accent-insensitive (consistent with filtering).

---

## Business rules

| Condition | Session preview | Note |
|---|---|---|
| Match on the note only | **Automatically opened** | Note visible with highlighting |
| Match on name + note | **Automatically opened** | Note visible with highlighting |
| Match on tabs + note | **Automatically opened** | Note visible with highlighting |
| Match on name only | Closed | N/A |
| No match | Session hidden | N/A |

---

## Search field (extended)

The search now applies to the following fields:

1. `session.name`: Session name
2. `group.title`: Title of each group
3. `tab.title`: Title of each tab
4. `tab.url`: URL of each tab
5. `session.note`: **Session note** *(new)*

---

## Out of scope

- Rich formatting (markdown, HTML) in the note.
- History of note modifications.
- Notes on groups or individual tabs.
