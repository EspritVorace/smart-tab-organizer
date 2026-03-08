# CLAUDE.md

## Commands

```bash
# Dev
npm run dev / dev:firefox    # Chrome / Firefox with auto-reload
npm run build / build:firefox
npm run zip / zip:firefox    # Distribution packages
npm run compile              # TypeScript check only

# Tests
npm test                     # Vitest unit tests
npm run test:watch / test:ui # Watch / Vitest UI
npm run test:wxt             # Vitest with WXT-aware environment
npm run test:e2e             # Playwright E2E
npm run test:e2e:ui          # Playwright with UI
npm run test:e2e:build       # wxt build then E2E
npm run test:e2e:headed

# Docs
npm run storybook            # port 6006
```

## Architecture

**Cross-browser extension** (WXT framework) — Chrome MV3 / Firefox MV2.

### Entry Points
- `src/entrypoints/background.ts` → delegates to `src/background/`
- `src/entrypoints/content.content.ts`
- `src/entrypoints/popup.html` / `options.html`

### Background Modules (`src/background/`)
`index.ts` · `grouping.ts` · `deduplication.ts` · `event-handlers.ts` · `messaging.ts` · `settings.ts` · `profileSync.ts` (auto-sync alarm + draft persistence)

### Storage
| Backend | Contents |
|---|---|
| `browser.storage.sync` | Domain rules, grouping/dedup toggles, notification prefs |
| `browser.storage.local` | Sessions, UI prefs (e.g. `popupStatsCollapsed`), help prefs |
| `browser.storage.session` | Profile–window map, sync drafts, editing guard |

`useSyncedSettings` hook uses refs to prevent race conditions.

### Schemas & Types
- `src/schemas/` — Zod schemas: `domainRule`, `enums`, `importExport`, `session`
- `src/schemas/importExport.ts` — relaxed schema (no form-level refinements) for import validation
- `src/types/` — TS types extending Zod-inferred types (e.g. `DomainRuleSetting` adds `enabled`, `badge`)

### Static Data
- `public/data/presets.json` — regex presets (read-only, loaded at runtime)
- `public/data/default_settings.json`
- `public/_locales/` — i18n messages (EN, FR, ES)

### Key Directories
```
src/
  background/      # Background service worker modules
  components/
    Core/          # DomainRule/ · RegexPreset/ · Session/ · Statistics/ · TabTree/
    UI/            # Header/ · PopupHeader/ · PopupToolbar/ · PopupProfilesList/
                   # PageLayout/ · Sidebar/ · ImportExportPage/ · SessionWizards/
                   # SettingsPage/ · SettingsToggles/ · WizardStepper/ · SplitButton/
                   # ConfirmDialog/ · StatusBadge/ · ThemeToggle/ · Combobox/ · DataTable/
    Form/          # FormFields/ · themed-callouts/ · themes/
  hooks/           # useSyncedSettings · useStatistics · useSessions · useSessionEditor · useModal · useClipboard
  pages/           # DomainRulesPage · SessionsPage · StatisticsPage · options.tsx · popup.jsx
  schemas/         # Zod schemas
  types/           # TS types
  utils/           # i18n · sessionStorage · sessionUtils · tabCapture · tabRestore
                   # profileWindowMap · conflictDetection · importClassification
                   # themeConstants · settingsUtils · statisticsUtils · notifications · …
  styles/          # radix-themes.css (custom focus for non-Radix markup only)
tests/             # Vitest unit tests
tests/e2e/         # Playwright E2E tests
```

### Features
1. **Automatic Grouping** — domain rules + regex presets (middle-click / right-click new tab)
2. **Deduplication** — exact URL / hostname+path / hostname / includes modes
3. **Rule Management** — CRUD for domain rules; built-in & custom regex presets
4. **Import/Export Wizard** — Zod-validated JSON, rule classification (new/conflicting/identical), conflict resolution
5. **Statistics** — grouping & dedup counters
6. **Sessions & Profiles** — snapshots of open tabs; pinned profiles with icon, auto-sync, window exclusivity; restore wizard with conflict resolution; interactive session editor

### Feature Themes (`src/utils/themeConstants.ts`)
`DOMAIN_RULES` purple · `REGEX_PRESETS` cyan · `IMPORT` jade · `EXPORT` teal · `STATISTICS` orange · `SETTINGS` gray · `SESSIONS` indigo

Theme wrappers in `src/components/Form/themes/` apply accent colors contextually.

### Internationalization
Always use `getMessage()` from `src/utils/i18n.ts` — for UI text, `aria-label`, and `title` attributes. Never hardcode strings.

## Code Conventions

### Type Safety
- No `any` — use precise types or unknown with narrowing.

### Accessibility
- Prefer Radix primitives over hand-rolled ARIA (Dialog, Collapsible, Toolbar, RadioGroup…).
- Radix Themes components (Switch, IconButton…) handle focus/keyboard/ARIA natively — don't override.
- Lucide icons: always `aria-hidden="true"`. Icon-only buttons need `aria-label` + `title`.
- Custom CSS focus rules only for non-Radix markup (see `src/styles/radix-themes.css`).

### Component Organization
- **Core/** — business logic tied to a domain concept
- **UI/** — layout and cross-feature interface components
- **Form/** — reusable form fields, themed callouts, theme providers

### Storybook
- Story titles mirror folder: `Components/Core/Session/SessionCard`
- Prefix all exports with component name: `SessionCardDefault`, `SessionCardDisabled` (avoids conflicts)
