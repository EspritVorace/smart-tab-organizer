---
name: new-component
description: Reminds the mandatory conventions for creating a new React component in this project (Storybook, i18n, logger, theming, accessibility).
user-invocable: false
---

Mandatory checklist for any new component in smart-tab-organizer:

## Location
- `src/components/Core/`: business logic tied to a domain concept
- `src/components/UI/`: layout and cross-feature components
- `src/components/Form/`: reusable form fields, themed callouts

## Storybook
- A `.stories.tsx` file is required in the same folder
- Title: `Components/Core/<Feature>/<ComponentName>` (mirrors the path)
- Prefix every export with the component name: `ComponentNameDefault`, `ComponentNameDisabled`

## Internationalization
- All text via `getMessage(key)` from `src/utils/i18n.ts` (typed facade over `@wxt-dev/i18n`)
- Never hardcode strings in JSX
- Add new keys to all three locales: `public/_locales/{en,fr,es}/messages.json`
- i18n placeholder format: `$1`, `$2` (not `{placeholder}`)
- `key` is type-checked: a typo is a compile error. After adding keys, run `pnpm i18n:types` to refresh `wxt-i18n-structure.d.ts`
- For dynamic keys, import `type MessageKey` from `src/utils/i18n.ts` and cast (`as MessageKey`)

## Logging
- `logger.debug('[MY_MODULE] message', value)` from `src/utils/logger.ts`
- Never `console.log()`. It is a no-op in production but a convention violation.

## Accessibility
- Lucide icons: always `aria-hidden="true"`
- Icon-only buttons: `aria-label` + `title` are required
- Prefer Radix primitives (Dialog, Collapsible, Toolbar, RadioGroup) over manual ARIA

## Theming
- Single accent color: `indigo` (Radix Themes default). Do not introduce a per-feature custom accent.
- `src/utils/themeConstants.ts` is kept for compatibility but every value is `indigo`: do not rely on it to differentiate features.
- Use Radix tokens (`var(--accent-a3)`, `var(--gray-a2)`, etc.) rather than hardcoded colors.

## CSS Modules (if hover actions)
```css
.row:hover .actions,
.row:focus-within .actions { opacity: 1; }
@media (pointer: coarse) { .actions { opacity: 1 !important; } }
```

## Types
- No `any`: use precise types or `unknown` with narrowing
- Zod schemas in `src/schemas/` for new persisted entities
