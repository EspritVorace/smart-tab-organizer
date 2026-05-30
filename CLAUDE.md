# CLAUDE.md

> This project uses pnpm as its package manager.

## Commands

```bash
# Dev
pnpm dev / dev:firefox    # Chrome / Firefox with auto-reload
pnpm build / build:firefox
pnpm zip / zip:firefox    # Distribution packages
pnpm compile              # TypeScript check only

# Tests
pnpm test                     # Vitest unit tests
pnpm test:watch / test:ui     # Watch / Vitest UI
pnpm test:coverage            # Vitest + coverage report
pnpm test:e2e                 # build + Playwright E2E
pnpm test:e2e:ui              # build + Playwright with UI
pnpm test:e2e:headed          # build + Playwright headed

# Docs
pnpm storybook                            # Storybook (port 6006)
pnpm docs:dev / docs:build / docs:preview # Astro Starlight (port 4321, deployed at https://docs.esprit-vorace.fr)
pnpm doc:scenarios                        # All screenshots: narrative journeys + feature screens (3 locales x 2 themes matrix)
pnpm doc:scenarios:audit                  # Audit routing manifests vs output / destinations
pnpm doc:scenarios:sync                   # Re-route output to dest dirs (without re-running Playwright)
```

## Architecture

**Cross-browser extension** (WXT framework), Chrome MV3 / Firefox MV2.

### Entry Points
- `src/entrypoints/background.ts` -> delegates to `src/background/`
- `src/entrypoints/content.content.ts`
- `src/entrypoints/popup.html` / `options.html`

### Background Modules (`src/background/`)
`index.ts` · `grouping.ts` · `deduplication.ts` · `event-handlers.ts` · `messaging.ts` · `migration.ts` · `settings.ts` · `organize.ts`

### Storage
| Backend | Contents |
|---|---|
| `browser.storage.local` | Domain rules, grouping/dedup toggles, notification prefs, sessions, UI prefs (e.g. `popupStatsCollapsed`), help prefs |
| `browser.storage.session` | Profile-window map, session drafts, editing guard |

`useSettings` hook uses refs to prevent race conditions. `useStorageState` unifies storage access for settings and statistics.

### Schemas & Types
- `src/schemas/`: Zod schemas: `common`, `domainRule`, `enums`, `importExport`, `session`
- `src/schemas/importExport.ts`: relaxed schema (no form-level refinements) for import validation
- `src/types/`: TS types extending Zod-inferred types (e.g. `DomainRuleSetting` adds `enabled`, `badge`), plus `messages.ts` (inter-component message types)

### Static Data
- `src/data/categories.json`: **single source of truth** for the 14 built-in
  rule categories. Consumed by domain rules (`DomainRule.categoryId`),
  sessions (`SessionData.categoryId`), regex presets (`presets.json`
  category buckets), and rule packs (`packs/pk-*.json` `categoryId`).
  Labels resolved via `labelKey` against `public/_locales/`.
- `src/data/packs/pk-*.json`: rule pack manifests, each referencing a
  unified `categoryId`.
- `public/data/presets.json`: regex presets (read-only, loaded at runtime).
  Each preset category only carries `id` + `presets`; the emoji and
  translated label come from `src/data/categories.json` via
  `categoriesStore`.
- `public/data/default_settings.json`
- `public/_locales/`: i18n messages (EN, FR, ES)

### Key Directories
```
src/
  background/      # Background service worker modules
  components/
    Core/          # DomainRule/ · Session/ · Statistics/ · TabTree/
    UI/            # AccessibleHighlight/ · Header/ · PopupHeader/ · PopupToolbar/
                   # PopupProfilesList/ · PageLayout/ · Sidebar/ · ImportExportWizards/
                   # SessionWizards/ · SettingsPage/ · SettingsToggles/ · WizardStepper/
                   # SplitButton/ · ConfirmDialog/ · StatusBadge/ · ThemeToggle/
                   # DataTable/ · OptionsLayout/
    Form/          # FormFields/
  hooks/           # useStorageState · useSettings · useStatistics · useSessions
                   # useSessionEditor · useDeepLinking
  pages/           # DomainRulesPage · SessionsPage · StatisticsPage · ImportExportPage · options.tsx · popup.tsx
  schemas/         # Zod schemas
  types/           # TS types + tabTree (shared TabTree types)
  utils/           # i18n · logger · sessionStorage · sessionUtils · tabCapture · tabRestore
                   # conflictDetection · deduplicationSkip · importClassification
                   # sessionClassification · sessionOrderUtils · ruleOrderUtils
                   # presetsToSearchableGroups · stringUtils · migration · tabTreeUtils
                   # storageItems · settingsUtils · statisticsUtils
                   # notifications · utils
  styles/          # radix-themes.css (custom focus for non-Radix markup only)
tests/             # Vitest unit tests
tests/e2e/         # Playwright E2E tests (functional)
e2e-shared/        # Shared Page Objects, Domain Actions, fixtures-base, matchers
e2e-doc-scenarios/ # All documentation captures (Starlight, README, Chrome Web Store)
```

### E2E architecture (Page Objects + Domain Actions)

Two Playwright pipelines (`tests/e2e/` for functional tests,
`e2e-doc-scenarios/` for all documentation captures) consume one shared
bundle under [`e2e-shared/`](./e2e-shared/README.md). The convergence
guarantees that a DOM evolution breaks both pipelines at the same call
site, which keeps the `e2e-flaky-detector` agent honest.

Layered model:

- `e2e-shared/pages/`: Page Objects (atomic locators + atomic actions +
  atomic assertions). One class per UI surface (dialog, page section,
  sub-modal). Subclass `DialogPage` for Radix dialogs.
- `e2e-shared/actions/`: Domain Actions (composed flows that narrate a
  single business outcome). Consumes Page Objects only; never reaches
  for raw locators.
- `e2e-shared/matchers/`: custom Playwright matchers
  (`toHaveDomainRulesCount`, `toHaveToast`, ...). Registered once.
- `e2e-shared/fixtures-base.ts`: worker-scoped `extensionContext` and
  `extensionId`. Pipelines extend the base instead of redeclaring it.

**Locale-agnostic by default**. The narrative pipeline runs across
`en`/`fr`/`es`; selectors anchor on `data-testid`, then Radix-stable
attributes (`[value="…"]`, `.rt-SegmentedControlItem`,
`svg.lucide-…`), and `getByRole({ name })` regex only as a fallback.
A locale-sensitive selector in a shared Page Object is a regression.

See [`e2e-shared/README.md`](./e2e-shared/README.md) for the full
convention and the template for adding a new Page Object or Domain
Action.

### Features
1. **Automatic Grouping**: domain rules + regex presets (middle-click / right-click new tab)
2. **Deduplication**: exact URL / URL without ignored params / includes modes; keep strategy (`keep-grouped-or-new` default, `keep-grouped`, `keep-old`, `keep-new`) decides which of the two matching tabs survives; the undo action captures `groupId` and tries to restore the closed tab's group membership
3. **Rule Management**: CRUD for domain rules; built-in & custom regex presets; drag-and-drop reordering
4. **Import/Export Wizard**: Zod-validated JSON for rules and sessions; rule/session classification (new/conflicting/identical); conflict resolution; optional note field
5. **Statistics**: grouping & dedup counters
6. **Sessions & Profiles**: snapshots of open tabs with optional note; pinned profiles with icon, window exclusivity; restore wizard with conflict resolution; interactive session editor; collapsed/expanded group state persistence; drag-and-drop session reordering; session card with HoverCard metadata and inline rename

### Theming
Single `indigo` accent (Radix Themes default). Prefer Radix tokens (`var(--accent-a3)`, `var(--gray-a2)`, etc.) over hardcoded colors.

### Internationalization
Always use `getMessage()` from `src/utils/i18n.ts`, for UI text, `aria-label`, and `title` attributes. Never hardcode strings.

### Keyboard shortcut conventions

Central registry: `src/shortcuts/registry.ts`. Detailed developer docs:
[`src/shortcuts/README.md`](./src/shortcuts/README.md).

**Adding a shortcut**

1. Add an entry to `SHORTCUTS_REGISTRY` (hierarchical kebab-case ID:
   `{scope}.{action}` or `{scope}.{action}.{variant}`).
2. Add `descriptionKey` to all three
   `public/_locales/{fr,en,es}/messages.json` files.
3. In the component: `useShortcuts({ 'my.id': handler }, { scope })`.
4. `pnpm shortcuts:doc` regenerates the Starlight `annexes/raccourcis-clavier` page.

**Combo format**

- Modifiers: `Mod` (Cmd/Ctrl), `Shift`, `Alt`, `Ctrl`, `Meta`. Order does not matter.
- Keys: lowercase (`Mod+Shift+r`).
- Special keys: CamelCase (`Escape`, `Enter`, `ArrowUp`).
- Sequence: array of combos (`['i', 'r']`).

**Registry vs. local handlers**

In the registry: every "learnable" user shortcut (i18n description,
reproducible behavior, expected to surface in the help panel).

Stays local: Enter/Escape on a rename input, comma to commit a tag,
arrow-key navigation inside a list (`useListNavigation`), keyboard
drag and drop driven by `dnd-kit`.

**User customization**

The `useShortcuts` facade hook reads its bindings via
`getEffectiveBindings(id)` (`src/shortcuts/getEffectiveBindings.ts`).
The Zod schema `ShortcutOverridesSchema`
(`src/shortcuts/overridesSchema.ts`) describes the storage format for
user overrides. There is no UI or active storage at this stage: both
modules exist so a future customization feature can plug in without
touching the callers.

## Code Conventions

### Logging
- **Never use `console.log()` directly.** Use `logger.debug()` from `src/utils/logger.ts` instead.
- The logger is a no-op in production builds (`import.meta.env.MODE === "production"`), keeping production console output clean.
- `console.warn()` and `console.error()` remain acceptable for real warnings/errors.

```ts
import { logger } from '../utils/logger.js';
logger.debug('[MY_MODULE] Something happened:', value);
```

### Type Safety
- No `any`: use precise types or unknown with narrowing.

### React
- React 19. Function components receive `ref` directly as a prop, not via `forwardRef`. To expose a ref, add `ref?: Ref<T>` to the props and forward it to the target DOM node.
- Do not reintroduce `forwardRef` in new code (deprecated in a future React release).

### Accessibility
- Prefer Radix primitives over hand-rolled ARIA (Dialog, Collapsible, Toolbar, RadioGroup...).
- Radix Themes components (Switch, IconButton...) handle focus/keyboard/ARIA natively, do not override.
- Lucide icons: always `aria-hidden="true"`. Icon-only buttons need `aria-label` + `title`.
- Custom CSS focus rules only for non-Radix markup (see `src/styles/radix-themes.css`).

### Component Organization
- **Core/**: business logic tied to a domain concept
- **UI/**: layout and cross-feature interface components
- **Form/**: reusable form fields

### Storybook
- Story titles mirror folder: `Components/Core/Session/SessionCard`
- Prefix all exports with component name: `SessionCardDefault`, `SessionCardDisabled` (avoids conflicts)

### Doc-scenarios (narrative captures)

Pipeline `e2e-doc-scenarios/` is the single source for every screenshot:
narrative user journeys (initial state, creation, real usage, sessions,
import/export, advanced states) plus standalone feature screens, across
3 locales x 2 themes. See
[`e2e-doc-scenarios/README.md`](./e2e-doc-scenarios/README.md) for
details.

- Scenarios under `e2e-doc-scenarios/scenarios/NN-name.scenario.ts`,
  paired with `NN-name.routing.ts` describing where to copy each
  capture.
- Raw output in `e2e-doc-scenarios/output/{locale}/{theme}/{scenario}/`
  (gitignored). Routes then copy to `docs/src/assets/screenshots/`,
  `doc/readme/` or `doc/chrome-web-store/`.
- Dedicated CI workflow: `.github/workflows/doc-scenarios.yml`
  (`workflow_dispatch` + tag push + weekly cron). Not triggered on PRs.
- For a narrative Starlight capture, prefix the route `path` with
  `journey-` to keep it visually distinct from the standalone feature
  screens (e.g. `popup-content`, `settings-misc`).

### Accessibility audits (axe-core)
Two layers run axe-core and share the same consolidated report:

- **Storybook**: `@storybook/addon-a11y` (live panel in dev) plus `@storybook/test-runner` runs axe on each story. In CI a dedicated `a11y-storybook` job runs in `tests.yml`.
- **Playwright E2E**: helper `tests/e2e/helpers/a11y.ts` (`auditPage`) instruments existing specs at key points. No-op until `A11Y_ENABLED=true` is in the environment. In CI, `A11Y_ENABLED=true` is enabled on the 3 existing E2E shards (no duplicate Playwright run).

The `report` job in `tests.yml` downloads the artifacts, consolidates the shards, produces `summary.md`, and posts a sticky PR comment (marker `<!-- a11y-report -->`).

Scripts:
```bash
pnpm a11y:storybook   # build Storybook, run test-runner + axe, consolidate the JSONL shard
pnpm a11y:e2e         # build extension, run Playwright with A11Y_ENABLED=true
pnpm a11y             # chains storybook, e2e, then consolidation
pnpm a11y:report      # reads both reports and produces reports/a11y/summary.md
```

Reports (gitignored, `reports/a11y/` folder):
- `storybook-shards.jsonl` (raw shard) then `storybook-a11y.json` (consolidated).
- `e2e-shards/*.jsonl` (raw shards per worker) then `e2e-a11y.json` (consolidated by globalTeardown).
- `summary.md`, `summary.json`: consolidated synthesis (table, top 10, baseline diff if `reports/a11y/baseline.json` exists).

Failure threshold configurable via `A11Y_FAIL_LEVEL` (values: `minor`, `moderate`, `serious` (default), `critical`, `none`).

To disable an axe rule locally (always with a justifying comment):
- Story: `parameters.a11y.config.rules = [{ id: 'aria-allowed-attr', enabled: false }]`.
- E2E: `await auditPage(page, 'label', { disableRules: ['region'] });`.

### Disabled state for focusable controls

Any `Button`, `IconButton`, or interactive element that needs to
explain why it is disabled uses `aria-disabled="true"` rather than
`disabled`. The component must:

1. Short-circuit its `onClick` when `aria-disabled` is true.
2. Keep its `tabIndex` so it remains focusable.
3. Always provide an explanation via a Radix Tooltip or
   `aria-describedby`.

Use `AriaButton` (`src/components/UI/AriaButton/AriaButton.tsx`) for
Radix buttons, or apply the pattern directly on native `<button>`
elements.

The native `disabled` attribute remains reserved for form inputs whose
value must not be submitted, and for transient loading states (e.g.
`isRestoring`, `isAnalyzing`) where a tooltip would not be relevant.

### Writing style
- **Never use the em-dash (`—`, U+2014) or en-dash (`–`, U+2013)** in textual content (docs, UI, comments, commit messages, PR descriptions, frontmatter, etc.).
- Reformulate instead: parentheses `(...)`, commas, colons `:`, or separate sentences.
- Rule applies to French, English and Spanish alike.

## Clarification before implementation

Before generating a plan or writing code for a new feature, identify
and resolve the unclear areas in the relevant user story.

### Process

1. Read the relevant US in `user-stories/`.
2. List ambiguous or uncovered points: edge cases, implicit
   behaviors, interactions with existing features, impact on the Zod
   schemas or types.
3. Ask the user the questions in a single batch, not piecemeal during
   implementation.
4. Once the answers are in, write the decisions down (as a comment in
   the prompt, or in a `clarifications.md` file inside the feature
   folder if the decisions are structural).
5. Only then: generate the technical plan and implement.

### Do not skip this step when

- The US references an entity whose fields are not all explicit.
- The US interacts with `browser.storage.local` or
  `browser.storage.session`.
- The US introduces a new UI component without specifying responsive
  behavior, empty states, or error states.
- The US touches the i18n system (new keys to add across all three
  locales).

## Available Claude agents

- **`e2e-flaky-detector`**: analyzes Playwright tests to spot
  fragility patterns (race conditions, fragile assertions, async
  storage without await).
- **`code-deduplicator`**: scans `src/` through the `jscpd` skill,
  presents a top 10 of the most painful duplications, applies the
  refactor chosen by the user (hook/component/util extraction) with
  guardrails (compile, tests, revert on failure, atomic commit).
  The agent runs `npx skills experimental_install` itself on each
  invocation to stay in sync with `skills-lock.json`.

### Skill jscpd
- Installed via `npx skills add kucherenko/jscpd` (once, lockfile
  versioned in `skills-lock.json`).
- Project config in `.jscpd.json` (pattern, ignore, formats).
- The skill source lives under `.agents/skills/jscpd/` (gitignored),
  recreated on demand by `npx skills experimental_install`.
