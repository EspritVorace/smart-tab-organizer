# Onboarding Prompt: Design System

To use during Claude Design onboarding, when Claude ingests this repo
or folder to build its internal representation of the design system.

For a project brief (page to generate), see `DASHBOARD_BRIEF.md` or
the upcoming dedicated briefs.

---

## Context

You are receiving the design system of a browser extension (Chrome MV3
+ Firefox MV2, WXT framework). The UI stack is built on:

- React 18 + `@radix-ui/themes` 3.2 (unified `indigo` accent, default
  radius / scaling),
- `next-themes` for light / dark / system,
- Storybook 9 (CSF3, `tags: ['autodocs']`, locale + theme toolbar),
- `lucide-react` for icons, `cmdk` for the searchable select,
  `react-hook-form` for forms, `@dnd-kit/react` for drag and drop.

No Tailwind, no proprietary `tokens.json`. Everything relies on Radix
CSS variables: `var(--accent-a3)`, `var(--accent-9)`,
`var(--accent-11)`, `var(--gray-a2)`, `var(--gray-11)`,
`var(--space-1..9)`, `var(--radius-2..4)`.

i18n via `browser.i18n.getMessage` (Chrome MV3 pattern, JSON catalogs
in `_locales/{en,fr,es}/messages.json`). The pack ships the EN locale.

## What the pack contains

| Folder / file | Role |
|---|---|
| `theme/themeConstants.ts` | Per-feature constants (all `indigo` today) |
| `theme/radix-themes.css` | Radix import + a11y resets + focus rings |
| `theme/Form.themes.tsx` | 7 theme wrappers (historical compat, all `indigo`) |
| `storybook/main.ts` + `preview.tsx` | Config + `wxt/browser` mock + locale / theme toolbar |
| `i18n/i18n.ts` + `messages.en.json` | `getMessage` utility + plural helper |
| `samples/atomic/StatusBadge` | Atomic pattern: enum to Badge mapping plus i18n |
| `samples/form/{FormField,FieldLabel,FieldError}` | Compound form pattern |
| `samples/layout/PageLayout` | Page layout: gradient header + description + content |
| `samples/composed/EmptyState` | Empty-state primitive |
| `samples/composition/SessionCard` | **Domain-locked**, included for HoverCard metadata + inline rename + sortable patterns |
| `samples/composition/DomainRuleCard` | **Domain-locked**, included for the `useSortable` + DropdownMenu + Card pattern |
| `conventions.md` | Code rules (theming, i18n, a11y, style) |
| `package.excerpt.json` | Relevant UI dependencies (reference only, not for install) |
| `tsconfig.json` | Path alias `@/*`, `moduleResolution: "bundler"` |

## Onboarding goal

Build an internal representation of the design system so that, in
later projects, you can:

1. **Produce idiomatic React + Radix Themes code**: use `<Card>`,
   `<Flex>`, `<Box>`, `<Grid>`, `<Heading>`, `<Text>`, `<Button>`,
   `<IconButton>`, `<Badge>`, `<Switch>`, `<Separator>`, `<Tooltip>`,
   `<DropdownMenu>`, `<HoverCard>`, `<Dialog>`, `<Collapsible>`,
   `<RadioGroup>` rather than custom markup.
2. **Respect the token system**: never hardcode a color, always use
   `var(--accent-*)`, `var(--gray-*)`, `var(--space-*)`, `var(--radius-*)`.
3. **Wire i18n in from the start**: every string goes through
   `getMessage('key')`, including `aria-label` and `title`. For Claude
   Design, if you generate a visual prototype with static text, mark
   each string with a `// i18n: key` comment to ease later extraction.
4. **Respect accessibility**: Lucide icons with `aria-hidden="true"`,
   icon-only buttons with `aria-label` + `title`, prefer Radix
   primitives over manual ARIA, visible focus rings on custom markup
   (see `radix-themes.css`).
5. **Treat the components in `samples/composition/`** as **patterns to
   abstract**, not to copy as-is. Their names (`SessionCard`,
   `DomainRuleCard`) are domain-locked. When reusing these patterns
   in a project, rename and decouple from the domain.

## Non-negotiable constraints

- No em-dash (`—`, U+2014) or en-dash (`–`, U+2013) in code,
  comments, UI text, stories, or commits. Reformulate with
  parentheses, commas, colons.
- No `console.log` in the delivered code. Use a logger that becomes a
  no-op in production.
- No TypeScript `any`. Use precise types or `unknown` with narrowing.
- No emoji in code and UI deliverables (tolerated only in docs and
  READMEs when the user explicitly asks for them).
- Single accent at the Radix root `<Theme>` level, no per-feature
  variation.

## Expected outputs for projects

When you generate a page or a component from this DS:

- A `.tsx` file ready to drop into `src/pages/` or
  `src/components/**/`.
- An associated `.stories.tsx` CSF3 file with `tags: ['autodocs']`
  and exports prefixed by the component name.
- The list of new i18n keys to add in
  `public/_locales/{en,fr,es}/messages.json`.
- A diff snippet for the routing / sidebar files affected
  (e.g. `src/pages/options.tsx`).
- If a standalone HTML export is produced (Claude Design Canvas),
  preserve the constraints above.
