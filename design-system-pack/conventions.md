# Conventions

Targeted excerpt from the source project's `CLAUDE.md`. The rules
below are the ones the target design system must respect and reflect.

## Theming

Single `indigo` accent (Radix Themes default). The
`theme/themeConstants.ts` file keeps the per-feature constants for
historical compatibility, but **all of them now point to `indigo`**.

Always prefer Radix tokens over hardcoded colors:

- `var(--accent-a3)`, `var(--accent-a6)`, `var(--accent-9)`,
  `var(--accent-11)`, etc.
- `var(--gray-a2)`, `var(--gray-11)`, etc.
- `var(--space-1)` to `var(--space-9)`
- `var(--radius-2)` to `var(--radius-4)`

The wrappers in `theme/Form.themes.tsx` remain (for compatibility) but
no longer apply a differentiated accent.

## Internationalization

Always use `getMessage()` from `i18n/i18n.ts`:

- for UI text,
- for `aria-label`,
- for `title`.

**Never hardcode a user-facing string.** The keys live in
`public/_locales/{en,fr,es}/messages.json` (Chrome MV3 format). The
pack only ships `en`, but the pattern is identical.

For plurals: `getPluralMessage(count, "keySingular", "keyPlural")`.

## Accessibility

- Prefer Radix primitives (`Dialog`, `Collapsible`, `Toolbar`,
  `RadioGroup`, `Tabs`) over a manual ARIA re-implementation.
- `@radix-ui/themes` components (Switch, IconButton...) handle focus,
  keyboard and ARIA natively; do not override them.
- Lucide icons: always `aria-hidden="true"`.
- Icon-only buttons: `aria-label` and `title` are mandatory.
- Custom CSS focus rules only for non-Radix markup
  (see `theme/radix-themes.css`).

## Logging

- **Never** call `console.log()` directly. Use `logger.debug()`
  imported from a dedicated utility.
- The logger is a no-op in production
  (`import.meta.env.MODE === "production"`) to keep the console clean.
- `console.warn()` and `console.error()` remain acceptable for real
  warnings or errors.

## Type Safety

No `any`. Use precise types or `unknown` with narrowing.

## Component organization

- **Core/**: domain-locked logic tied to a concept (excluded from this
  pack).
- **UI/**: layout and cross-feature interface components.
- **Form/**: reusable form fields, themed callouts, theme providers.

## Storybook

- Titles mirror the directory layout:
  `Components/UI/StatusBadge/StatusBadge`.
- Every export is prefixed with the component name to avoid
  collisions: `StatusBadgeNew`, `StatusBadgeWarning`,
  `StatusBadgeDeleted`.
- CSF3: `export const StoryName: Story = { args: { ... } }`.
- `tags: ['autodocs']` for auto-generated docs.

## Writing style

**Never use the em-dash (`—`, U+2014) or en-dash (`–`, U+2013)** in
textual content (docs, UI, comments, commit messages, PR descriptions,
frontmatter).

Reformulate instead: parentheses `(...)`, commas, colons `:`, or
separate sentences.

Rule applies to French, English and Spanish alike.
