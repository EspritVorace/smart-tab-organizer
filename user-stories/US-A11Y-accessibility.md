# User Stories - Domain A11Y: Disabled state of focusable controls

---

## US-A11Y001 - `aria-disabled` pattern on focusable buttons

**As a** user navigating with the keyboard or using a screen reader,
**I want** disabled buttons to remain accessible via the Tab key,
**so that** I can discover their existence and understand why I cannot activate them.

### Context

The HTML `disabled` attribute removes the element from the tab order and prevents
any focus or hover event. A `disabled` button is invisible to assistive technology
users: it is not announced, the reason for its disabled state is not discoverable,
and the user does not know how to unblock it.

### Acceptance criteria

- Buttons using `aria-disabled="true"` remain in the tab order (Tab).
- The screen reader announces the `disabled` state via `aria-disabled`.
- A click or Enter/Space press on an `aria-disabled` button does not trigger any action.
- The CSS values `cursor: not-allowed` and `opacity: 0.5` visually signal the disabled state.

### Affected components

- `src/components/UI/AriaButton/AriaButton.tsx`: Radix Button wrapper.
- `src/components/UI/PopupToolbar/PopupToolbar.tsx`: Save, Restore, Organize buttons.
- `src/components/UI/SplitButton/SplitButton.tsx`: primary button and chevron.

---

## US-A11Y002 - Surfacing the reason for a disabled state

**As a** user navigating with the keyboard or using a screen reader,
**I want** to see or hear why a button is disabled when I place focus on it,
**so that** I know what action to take to unblock it.

### Acceptance criteria

- A Radix Tooltip appears on mouse hover AND on keyboard focus on an `aria-disabled` button.
- The Tooltip content is provided via the `disabledReason` prop (Radix components) or
  via a conditional `<Tooltip>` wrapping (native buttons).
- The Tooltip does not appear when the button is disabled due to a transient loading
  state (e.g. `isRestoring`, `isAnalyzing`).

### Example messages

| Button | Message |
|---|---|
| Popup Save (no active group) | `popupSaveDisabledHint` |
| Popup Restore (no sessions) | `popupRestoreDisabledHint` |
| Wizard Restore (no tab selected) | `wizardRestoreNoTabsHint` |

---

## US-A11Y003 - Compatibility with high contrast mode

**As a** user in Windows High Contrast or forced-colors mode,
**I want** `aria-disabled` buttons to remain visually distinguishable,
**so that** I do not confuse them with active buttons.

### Acceptance criteria

- The CSS rule `@media (forced-colors: active)` applies `border-color: GrayText`
  and `color: GrayText` to `[aria-disabled="true"]`.
- Disabled controls are visually distinct from active controls in Windows high
  contrast mode.
