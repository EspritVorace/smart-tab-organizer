# Design System Starter Pack

Context pack intended for Claude Design (design system onboarding).
Extracted from the **Smart Tab Organizer** browser extension (Chrome MV3 /
Firefox MV2, WXT framework).

## Intended use

1. **Onboard Claude Design** with this folder (via codebase connection or
   upload). It builds its representation of the design system.
2. **Generate internal extension pages** (e.g. a Dashboard) that respect
   the design system. See `DASHBOARD_BRIEF.md` for the first project brief.

This is **not** a pack for producing a marketing site or a web homepage:
the generated pages sit at the same level as `DomainRulesPage`,
`SessionsPage`, `StatisticsPage`, `ImportExportPage`, `SettingsPage` in
`src/pages/`.

## What this pack is for

It contains only the current visual and technical DNA:

- tokens and theming,
- Storybook configuration,
- the i18n utility and the EN catalog,
- four representative components (atomic, form, layout, empty state) with
  their stories,
- code conventions.

Everything else (domain logic: background worker, Zod schemas, sessions,
domain rules, tab tree, popup, import/export, Astro docs, unit tests,
Playwright E2E tests) has been deliberately excluded.

## Stack

| Item | Version |
|---|---|
| React | 18.3 |
| @radix-ui/themes | 3.2.1 (single accent, `indigo`) |
| next-themes | 0.4 (light / dark / system) |
| Storybook | 9.1 (CSF3, autodocs) |
| lucide-react | 0.522 |
| cmdk | 1.1 |
| react-hook-form | 7.58 |
| WXT | 0.20 (extension build, out of DS scope) |

No Tailwind, no `tokens.json`. Everything goes through Radix Themes CSS
variables (`var(--accent-*)`, `var(--space-*)`, `var(--radius-*)`,
`var(--gray-*)`).

## Structure

```
design-system-pack/
├── README.md                  # this file
├── PROMPT.md                  # brief to paste into Claude Design
├── conventions.md             # code rules extracted from CLAUDE.md
├── package.excerpt.json       # UI deps (reference only, not for install)
├── tsconfig.json              # paths alias @/*, moduleResolution bundler
│
├── storybook/
│   ├── main.ts                # mock wxt/browser + stories glob
│   └── preview.tsx            # locale toolbar (EN/FR/ES) + theme (light/dark)
│
├── theme/
│   ├── radix-themes.css       # Radix import + resets + a11y focus rings
│   ├── themeConstants.ts      # FEATURE_THEMES (all indigo)
│   └── Form.themes.tsx        # 7 Theme wrappers (currently all indigo)
│
├── i18n/
│   ├── i18n.ts                # getMessage + getPluralMessage
│   └── messages.en.json       # ~165 keys, Chrome MV3 pattern
│                              # (FR/ES exist with the same structure,
│                              # excluded to keep the pack lean)
│
└── samples/
    ├── atomic/                # StatusBadge + stories
    ├── form/                  # FormField + FieldLabel + FieldError + stories
    ├── layout/                # PageLayout + stories (gradient header)
    ├── composed/              # EmptyState + stories
    └── composition/           # Advanced composition patterns (domain-locked)
                               # SessionCard: HoverCard metadata + inline rename
                               #              + @dnd-kit sortable
                               # DomainRuleCard: @dnd-kit sortable + HoverCard
                               #                  + DropdownMenu + Badge
                               # MEANT TO BE ABSTRACTED, not copied as-is
```

## Key takeaways for the design system author

1. **Accent is unified on `indigo`** across the entire extension. The
   per-feature wrappers (`DomainRulesTheme`, `SessionsTheme`, etc.) exist
   for historical reasons but all point to `indigo`. The target design
   system should expose a single configurable accent at the
   `ThemeProvider` level, not 7 wrappers.

2. **i18n is mandatory everywhere**: UI text, `aria-label`, `title`.
   Inside the extension, `getMessage` wraps WXT's
   `browser.i18n.getMessage`. The target design system must stay
   agnostic: accept a `t?: (key: string) => string` prop or an optional
   `I18nProvider`, falling back to displaying the key.

3. **Accessibility**: prefer Radix primitives (`Dialog`, `Collapsible`,
   `Toolbar`, `RadioGroup`) over re-implementing ARIA. Lucide icons must
   carry `aria-hidden="true"`. Icon-only buttons require `aria-label` and
   `title`.

4. **Style conventions**: no em-dash (`—`) or en-dash (`–`) anywhere.
   No `console.log`; route through a logger that becomes a no-op in
   production. No `any`. See `conventions.md`.

5. **Storybook**: strict CSF3, `tags: ['autodocs']`, titles that mirror
   the directory layout (`Components/UI/StatusBadge/StatusBadge`), and
   every export prefixed with the component name
   (`StatusBadgeNew`, `StatusBadgeWarning`) to avoid ID collisions.

## How to use the pack

1. Push this folder as a **standalone Git repository** (the pack is set
   up for it, see `../design-system-pack-repo/` produced by the
   extraction script).
2. In Claude Design, onboard the design system by pointing it at this
   repo (documented "codebase" workflow).
3. Paste `PROMPT.md` as the onboarding instruction if the UI allows it,
   otherwise let Claude Design infer from the files.
4. To generate the Dashboard page, open a new project in Claude Design
   and paste the contents of `DASHBOARD_BRIEF.md` as the project brief.

Alternative without a Git repo: upload the files individually (images,
DOCX, PPTX supported; ZIP undocumented). Less fluid.

## What is NOT in the pack (intentionally)

- `docs/` Astro Starlight site (13 MB, no value for a DS).
- `tests/` unit tests and `tests/e2e/` Playwright tests.
- `src/background/`, `src/entrypoints/background.ts`,
  `src/entrypoints/content.content.ts`.
- `src/schemas/` Zod business schemas.
- `src/components/Core/{Statistics,TabTree}` and the rest of `Session/`
  and `DomainRule/`: domain-locked. Only `SessionCard` and
  `DomainRuleCard` are included under `samples/composition/` as
  patterns to be abstracted.
- `src/components/UI/{PopupHeader,PopupToolbar,PopupProfilesList,
  ImportExportWizards,SessionWizards,Sidebar,SettingsPage,
  SettingsToggles,OptionsLayout}`: too specific to the extension.
- `public/data/*.json` (regex presets, default settings).
- `pnpm-lock.yaml`, `node_modules/`, `.output/`, `.wxt/`.
- The FR and ES locales of `messages.json` (same structure as EN, not
  required to grasp the pattern).
