# Smart Tab Organizer: Design System

> Version 1.1.3. Synthesis aimed at Claude Design (claude.ai/design) for generating new screens consistent with the extension. Every rule is sourced from the codebase and `CLAUDE.md`.

## 1. Visual Theme & Atmosphere

Cross-platform browser extension (Chrome MV3, Firefox MV2) dedicated to tab organization.

- **Tone**: calm productivity, professional, dense yet readable.
- **Density**: medium. Popup 420 px wide (compact), options pages more breathable.
- **Atmosphere**: technical and understated, subtle gradients via Radix alpha tokens (`--accent-a3`, `--gray-a2`).
- **Dark mode**: native via `next-themes` (`ThemeProvider` at the root), with a user switcher light / dark / system.
- **UI framework**: [Radix Themes](https://www.radix-ui.com/themes) v3. Every visible component goes through Radix primitives.
- **App framework**: React 18 + WXT (extension runtime), strict TypeScript.

## 2. Color Palette & Roles

Single accent **`indigo`** across the whole app. Radix neutrals **`gray`**. No custom palette.

### Radix tokens used

| CSS token | Usage |
|-----------|-------|
| `var(--accent-9)` | Strong accent color (focus ring, primary button, switch on) |
| `var(--accent-a3)` | Subtle tinted background for active / selected states |
| `var(--accent-11)` | Accent text on light backgrounds |
| `var(--gray-1)` to `var(--gray-12)` | Neutral scale (backgrounds, borders, text) |
| `var(--gray-a2)`, `--gray-a3` | Card surfaces (hover, selection) |
| `var(--red-9)`, `--amber-9`, `--green-9` | Status (error, warning, success) via `StatusBadge` |
| `var(--radius-3)` | Standard radius for cards / inputs |

### Theme provider

```tsx
import { Theme } from '@radix-ui/themes';

<Theme appearance="inherit" accentColor="indigo" grayColor="slate" radius="medium" scaling="100%">
  {children}
</Theme>
```

Single `indigo` accent applied at the root `<Theme>`. The per-feature wrappers in `src/components/Form/themes/index.tsx` (`DomainRulesTheme`, `SessionsTheme`, etc.) remain for compatibility but no longer apply a differentiated accent.

### Rule

> Prefer Radix tokens (`var(--accent-a3)`, `var(--gray-a2)`, etc.) over hardcoded colors. No raw hex inside components.

## 3. Typography Rules

Default Radix Themes typography stack (no `font-family` override). System font through the Radix variable.

### Scale

Use `<Text size="1">` to `<Text size="9">` and `<Heading size="1">` to `"9"` provided by Radix.

| Usage | Component |
|-------|-----------|
| Page title | `<Heading size="6">` |
| Section title | `<Heading size="4">` |
| Card title | `<Text size="3" weight="medium">` |
| Body | `<Text size="2">` |
| Meta / hint | `<Text size="1" color="gray">` |
| Form label | `<Text size="2" weight="medium">` via `FieldLabel` |

### Rule

Do not use raw CSS `font-size`. Always go through Radix props.

## 4. Component Stylings

### 4.1 Form (`src/components/Form/`)

| Component | Radix primitive | States | File |
|-----------|-----------------|--------|------|
| `FormField` | `<Flex>` + `<Text>` | error, disabled | `Form/FormFields/FormField/` |
| `FieldLabel` | `<Text size="2" weight="medium">` | required, disabled | `Form/FormFields/FieldLabel/` |
| `FieldError` | `<Text size="1" color="red">` | visible on error | `Form/FormFields/FieldError/` |
| `RadioGroupField` | Radix `<RadioGroup>` | default, checked, disabled | `Form/FormFields/RadioGroupField/` |
| `SearchableSelect` | `cmdk` + Radix `<Popover>` | closed, open, searching, empty | `Form/FormFields/SearchableSelect/` |
| `TagInputField` | `<TextField>` + tags Radix Badge | default, focus, tag hover | `Form/FormFields/TagInputField/` |
| `TextFieldWithCategory` | `<TextField>` + `<Select>` | default, focus, error | `Form/FormFields/TextFieldWithCategory/` |

Every field accepts `label`, `error`, `hint`, `required`, `disabled`, and forwards refs to the native input.

### 4.2 UI primitives (`src/components/UI/`)

| Component | Role | Primitive |
|-----------|------|-----------|
| `ConfirmDialog` | Destructive confirmation | Radix `<AlertDialog>` |
| `DialogShell` | Generic modal shell | Radix `<Dialog>` |
| `WizardModal` | Multi-step modal | `DialogShell` + `WizardStepper` |
| `WizardStepper` | Progress bar | composed with `<Flex>` |
| `SplitButton` | Primary button + dropdown | Radix `<Button>` + `<DropdownMenu>` |
| `StatusBadge` | Status indicator (ok, warn, error) | Radix `<Badge>` |
| `ThemeToggle` | Light / dark / system | `<IconButton>` + `<DropdownMenu>` + Lucide `Sun`, `Moon`, `Monitor` |
| `Toaster` | Ephemeral notifications | `@radix-ui/react-toast` |
| `AccessibleHighlight` | Search-text highlight | `<mark>` + Radix styles |
| `EmptyState` | Empty list placeholder | centered `<Flex direction="column">` |

### 4.3 UI layout (`src/components/UI/`)

| Component | Role |
|-----------|------|
| `PageLayout` | Main container (header + content + footer) |
| `Header` | Page header with title + actions |
| `Sidebar` | Collapsible side navigation |
| `OptionsLayout` | Options-page wrapper |
| `PopupHeader`, `PopupToolbar`, `PopupProfilesList` | 420 px popup surfaces |
| `ListToolbar` | Action bar for lists (add, filter, sort) |
| `SettingsPage`, `SettingsToggles` | Settings container + toggle groups |
| `SessionWizards`, `ImportExportWizards` | Multi-step wizard compositions |

### 4.4 Common states

Each component must handle:

1. **Default**
2. **Hover** (fine pointer): `--accent-a4` / `--gray-a3` tokens
3. **Focus visible**: `var(--accent-9)` outline 2 px negative offset (Radix handles it natively except for `[role="row"][tabindex]` and `[data-session-card]`, see `src/styles/radix-themes.css`)
4. **Active / pressed**
5. **Disabled**: Radix opacity + `cursor: not-allowed`
6. **Loading** (async action buttons): Lucide `Loader2` spinner + disabled button

## 5. Layout Principles

- **Primitives**: Radix Themes `<Flex>`, `<Grid>`, `<Box>`, `<Container>`, `<Section>`.
- **Gap**: via the Radix `gap` prop (`"1"` to `"9"`), no custom margins.
- **Spacing scale**: Radix tokens `--space-1` (4 px) to `--space-9` (64 px).
- **Options pages**: `<Container size="3">` (1064 px max).
- **Popup**: fixed 420 px width, variable height up to the browser limit.
- **Cards**: Radix `<Card>`, `padding="3"` standard, `padding="4"` on options pages.

## 6. Depth & Elevation

Limited use. Available Radix tokens: `--shadow-1` to `--shadow-6`.

| Level | Usage |
|-------|-------|
| `var(--shadow-2)` | Default Radix `<Card>` |
| `var(--shadow-4)` | Popover, dropdown |
| `var(--shadow-5)` | Dialog, AlertDialog |
| `var(--shadow-6)` | Toast |

**Do not** stack shadows or add custom CSS shadows.

## 7. Do's and Don'ts

### Do

- **i18n everywhere**: always `getMessage()` from `src/utils/i18n.ts` for labels, `aria-label`, `title`, placeholders. The 3 locales (en, fr, es) must stay in sync.
- **Radix primitives first**: Dialog, Collapsible, Toolbar, RadioGroup, DropdownMenu, Tooltip, Switch, IconButton. Let Radix manage focus, keyboard, and ARIA.
- **Lucide icons**: always `aria-hidden="true"` on decorative icons. Icon-only buttons: `<IconButton aria-label="..." title="...">`.
- **Radix tokens** only (`var(--accent-9)`, `var(--gray-a2)`, `var(--radius-3)`, `var(--space-3)`).
- **Strict typing**: no `any`. Prefer `unknown` + narrowing.
- **Storybook**: one story per component, titles mirror the folder (`Components/UI/Header`), exports prefixed with the name (`HeaderDefault`, `HeaderLight`).

### Don't

- **Never `console.log`**: use `logger.debug()` (`src/utils/logger.ts`). `console.warn` / `console.error` are allowed for real errors.
- **Never hardcode strings** in the UI (no labels, no aria, no title).
- **Never write manual ARIA** if a Radix primitive already exists.
- **Never override focus** on Radix components (already correct). Custom CSS focus is reserved for non-Radix elements (see `src/styles/radix-themes.css`).
- **Never hardcode hex colors**. Always a Radix token.
- **Never use the em-dash** (U+2014) or en-dash (U+2013) in text. Prefer parentheses, commas, or colons.

## 8. Responsive Behavior

### Popup (fixed 420 px)

- No horizontal breakpoint, fixed width.
- Vertical scroll only, height limited by the browser (around 600 px).
- No sidebar. Navigation via tabs or compact buttons.
- Reduced typography: `<Text size="2">` by default.

### Options page (adaptive)

- `<Container size="3">` to center up to 1064 px.
- **Collapsible sidebar** (`Sidebar` UI): visible >= 960 px, foldable on click. Below: burger menu.
- Touch targets: minimum 40 px (Radix `size="2"` or `"3"` for buttons on pages).
- Images / illustrations: none (only inline Lucide SVGs).

### Storybook

Preview decorator with locale switchers (en / fr / es) and theme (light / dark / system) to test every surface.

## 9. Agent Prompt Guide

Sample prompts to feed Claude Design after onboarding:

### Generate a new page

> Create a `NotificationsPage` aligned with the `SettingsPage` pattern: Radix container, `<Heading size="6">` title, list of toggles grouped by category via `SettingsToggles`. Respect the `indigo` accent, use i18n via `getMessage()`, Radix tokens only.

### Vary an existing component

> Generate a `compact` variant of `SessionCard`: 48 px height, show only the name and the date, drop the `HoverCard` metadata. Keep the custom focus ring (`[data-session-card]:focus`).

### Add a wizard

> Propose a 3-step wizard for profile export: profile selection, options (format, include notes), confirmation. Base it on `WizardModal` + `WizardStepper`. Each step must have a Back and Next button, the last one being a primary button with `<Loader2>` in loading.

### Rework a popup surface

> Redesign `PopupToolbar` to fit in 36 px tall by 420 px wide: Lucide icons `Plus`, `Search`, `Filter`, `Settings`. Each button: `<IconButton size="1" aria-label="..." title="...">`. Respect the Radix accessibility rules.

### Generate an empty screen

> Generate an EmptyState for the Sessions page: Lucide `ArchiveRestore` illustration, i18n title `emptySessionsTitle`, text `emptySessionsHint`, primary CTA `emptySessionsCta`. Respect the `EmptyState/` pattern.

---

**Source repository**: see folders `src/components/UI/`, `src/components/Form/`, `src/pages/` and `.storybook/` included in the bundle for the reference implementations.
