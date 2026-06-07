# Keyboard shortcuts system

Developer documentation for the shortcut system. The matching user-facing page
is generated at
`docs/src/content/docs/{,en/,es/}annexes/raccourcis-clavier.mdx` by
`pnpm shortcuts:doc`.

## Overview

Three source files live here:

| File | Role |
|---|---|
| `registry.ts` | Single source of truth: `SHORTCUTS_REGISTRY` maps each ID to its bindings, i18n description, display group and scope. |
| `types.ts` | `ShortcutScope`, `ShortcutGroupId`, `Binding`, `ShortcutEntry` types. |
| `groups.ts` | Display hierarchy (`GROUP_DESCRIPTORS`, `getDisplayTree(surface)`, `isGroupOpenByDefault`). |
| `getEffectiveBindings.ts` | Binding resolution (today: defaults; tomorrow: user overrides). |
| `overridesSchema.ts` | Zod schema reserved for future user customization. |

On the hook side:

- `useShortcuts` (`src/hooks/useShortcuts.ts`): the public facade. Every
  application caller goes through it. Dispatches simple combos and sequences,
  applies scope filters (`widget:*`, `excludeIfInsideWidget`) and contextual
  filters (`allowInTypingTarget`, `allowWhenDialogOpen`).
- `src/utils/keyboardShortcuts.ts`: low-level utilities (`parseCombo`,
  `serializeKeyEvent`, `matchesBinding`, `isSequencePrefix`,
  `isTypingTarget`, `isDialogOpen`, widget selectors). Direct calls are
  reserved for justified cases (e.g. `ShortcutsDrawer`, which listens in the
  capture phase to intercept `?` despite `allowWhenDialogOpen: false`).

## Adding a simple shortcut

```ts
// 1. Add the entry in SHORTCUTS_REGISTRY (registry.ts)
'rules.duplicate': {
  id: 'rules.duplicate',
  defaultBindings: ['d'],
  descriptionKey: 'shortcutDescDuplicateRule',
  group: 'list-rules',
  scope: 'page:rules',
},
```

```jsonc
// 2. Add shortcutDescDuplicateRule to all three messages.json files
{ "shortcutDescDuplicateRule": { "message": "Duplicate the focused rule" } }
```

```tsx
// 3. Wire up the action in the component
useShortcuts(
  { 'rules.duplicate': () => duplicate(focusedRuleId) },
  { scope: 'page:rules' },
);
```

```bash
# 4. Regenerate the Starlight page
pnpm shortcuts:doc
```

## Adding a sequence

A sequence is an array of combos. It must contain at least two steps, and the
first key must never be reused as a simple combo within the same scope
(otherwise the timeout would delay the simple combo).

```ts
'importexport.import.workspaces': {
  id: 'importexport.import.workspaces',
  defaultBindings: [['i', 'w']],
  descriptionKey: 'shortcutDescImportWorkspaces',
  group: 'importexport',
  scope: 'page:importexport',
},
```

`tests/shortcuts/registry.test.ts` enforces that the prefixes `i` and `e` are
not also reserved by simple combos on `page:importexport`, and that `w` (the
workspace-switch prefix: `w n` / `w p` / `w l`) stays free as a simple combo on
the `global` scope.

## Adding a widget shortcut (focused card)

```ts
'sessionCard.archive': {
  id: 'sessionCard.archive',
  defaultBindings: ['a'],
  descriptionKey: 'shortcutDescSessionArchive',
  group: 'session-card',
  scope: 'widget:session-card',
},
```

In the component, the card wrapper must carry
`data-shortcut-scope="widget:session-card"` and be focusable. `useShortcuts`
already filters: only the event whose `event.target` matches the
`[data-shortcut-scope="widget:session-card"]` selector triggers the handler.

## Registry vs local handlers

Goes into the registry: anything that is

- documented in the help panel,
- user-facing (learnable, memorable),
- meant to appear in the Starlight docs.

Stays out of the registry (handled locally on the element):

- Enter/Escape on an inline rename input,
- comma to commit a tag in a combobox,
- arrow-key navigation inside a virtualized list (use `useListNavigation`),
- keyboard drag and drop driven by `dnd-kit`.

## User customization (prepared, not shipped)

`useShortcuts` reads its bindings via `getEffectiveBindings(id)` instead of
`SHORTCUTS_REGISTRY[id].defaultBindings`. No behavior change today: the
function returns the `defaultBindings`. A future feature will route the read
through `browser.storage.local['shortcutOverrides']`, validated by
`ShortcutOverridesSchema`. No caller (component or test) will need to change
when customization ships.

## Regenerating the docs

```bash
pnpm shortcuts:doc
```

Generates three MDX files (`raccourcis-clavier.mdx` at the root plus `en/`
and `es/`) under `docs/src/content/docs/annexes/`. Idempotent: two
consecutive runs produce the same file. CI
(`.github/workflows/doc-scenarios.yml`) runs the command and then checks via
`git diff --exit-code` that the commit ships the updated docs.
