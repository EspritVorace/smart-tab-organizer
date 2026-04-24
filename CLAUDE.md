# CLAUDE.md

> Ce projet utilise pnpm comme gestionnaire de paquets.

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
pnpm docs:dev / docs:build / docs:preview # Astro Starlight (port 4321)
pnpm screenshots                          # Deterministic multi-locale/theme screenshots
```

## Architecture

**Cross-browser extension** (WXT framework) — Chrome MV3 / Firefox MV2.

### Entry Points
- `src/entrypoints/background.ts` → delegates to `src/background/`
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
- `src/schemas/` — Zod schemas: `common`, `domainRule`, `enums`, `importExport`, `session`
- `src/schemas/importExport.ts` — relaxed schema (no form-level refinements) for import validation
- `src/types/` — TS types extending Zod-inferred types (e.g. `DomainRuleSetting` adds `enabled`, `badge`), plus `messages.ts` (inter-component message types)

### Static Data
- `public/data/presets.json` — regex presets (read-only, loaded at runtime)
- `public/data/default_settings.json`
- `public/_locales/` — i18n messages (EN, FR, ES)

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
    Form/          # FormFields/ · themes/
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
tests/e2e/         # Playwright E2E tests
```

### Features
1. **Automatic Grouping** : domain rules + regex presets (middle-click / right-click new tab)
2. **Deduplication** : exact URL / URL without ignored params / includes modes; keep strategy (`keep-grouped-or-new` default, `keep-grouped`, `keep-old`, `keep-new`) to decide which of the two matching tabs survives; undo action captures `groupId` and tries to restore group membership of the closed tab
3. **Rule Management** : CRUD for domain rules; built-in & custom regex presets; drag-and-drop reordering
4. **Import/Export Wizard** : Zod-validated JSON for rules and sessions; rule/session classification (new/conflicting/identical); conflict resolution; optional note field
5. **Statistics** : grouping & dedup counters
6. **Sessions & Profiles** : snapshots of open tabs with optional note; pinned profiles with icon, window exclusivity; restore wizard with conflict resolution; interactive session editor; collapsed/expanded group state persistence; drag-and-drop session reordering; session card with HoverCard metadata and inline rename

### Theming
Accent unique `indigo` (défaut Radix Themes). Préférer les tokens Radix (`var(--accent-a3)`, `var(--gray-a2)`, etc.) aux couleurs hardcodées. Les wrappers dans `src/components/Form/themes/` restent en place mais n'appliquent plus d'accent différencié.

### Internationalization
Always use `getMessage()` from `src/utils/i18n.ts` — for UI text, `aria-label`, and `title` attributes. Never hardcode strings.

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

### Accessibility audits (axe-core)
Two layers run axe-core et partagent le même rapport consolidé :

- **Storybook** : `@storybook/addon-a11y` (panel live en dev) plus `@storybook/test-runner` qui exécute axe sur chaque story. En CI un job dédié `a11y-storybook` tourne dans `tests.yml`.
- **Playwright E2E** : helper `tests/e2e/helpers/a11y.ts` (`auditPage`) instrumente les specs existantes aux points clés. No-op tant que `A11Y_ENABLED=true` n'est pas dans l'environnement. En CI, `A11Y_ENABLED=true` est activé sur les 3 shards E2E existants (pas de run Playwright en double).

Le job `report` de `tests.yml` télécharge les artefacts, consolide les shards, produit `summary.md` et publie un commentaire sticky PR (marker `<!-- a11y-report -->`).

Scripts :
```bash
pnpm a11y:storybook   # build Storybook, lance test-runner + axe, consolide le shard JSONL
pnpm a11y:e2e         # build extension, lance Playwright avec A11Y_ENABLED=true
pnpm a11y             # enchaîne storybook, e2e, puis consolidation
pnpm a11y:report      # lit les deux rapports et génère reports/a11y/summary.md
```

Rapports (gitignorés, dossier `reports/a11y/`) :
- `storybook-shards.jsonl` (shard brut) puis `storybook-a11y.json` (consolidé).
- `e2e-shards/*.jsonl` (shards brut per-worker) puis `e2e-a11y.json` (consolidé par globalTeardown).
- `summary.md`, `summary.json` : synthèse consolidée (tableau, top 10, diff baseline si `reports/a11y/baseline.json` existe).

Seuil d'échec configurable via `A11Y_FAIL_LEVEL` (valeurs : `minor`, `moderate`, `serious` (défaut), `critical`, `none`).

Pour désactiver une règle axe localement (à accompagner d'un commentaire justificatif) :
- Story : `parameters.a11y.config.rules = [{ id: 'aria-allowed-attr', enabled: false }]`.
- E2E : `await auditPage(page, 'label', { disableRules: ['region'] });`.

### Style d'écriture
- **Ne jamais utiliser de tiret cadratin (`—`, U+2014) ni de tiret demi-cadratin (`–`, U+2013)** dans les contenus textuels (docs, UI, commentaires, commit messages, PR descriptions, frontmatter, etc.).
- Préférer une reformulation : parenthèses `(...)`, virgules, deux-points `:`, ou phrases séparées.
- Cette règle s'applique au français, à l'anglais et à l'espagnol.

## Clarification avant implémentation

Avant de générer un plan ou d'écrire du code pour une nouvelle feature,
identifier et résoudre les zones floues de la user story concernée.

### Processus

1. Lire la ou les US concernées dans `user-stories/`.
2. Lister les points ambigus ou non couverts : cas limites, comportements
   implicites, interactions avec des features existantes, impact sur les
   schemas Zod ou les types.
3. Poser les questions groupées à l'utilisateur — une seule passe,
   pas de questions au fil de l'implémentation.
4. Une fois les réponses obtenues, noter les décisions prises sous forme
   de commentaire dans le prompt ou dans un fichier `clarifications.md`
   dans le dossier de la feature si les décisions sont structurantes.
5. Seulement ensuite : générer le plan technique et implémenter.

### Ne pas sauter cette étape si

- La US référence une entité dont les champs ne sont pas tous explicites.
- La US interagit avec `browser.storage.local` ou `browser.storage.session`.
- La US introduit un nouveau composant UI sans préciser le comportement
  responsive, les états vides, ou les états d'erreur.
- La US touche au système i18n (nouvelles clés à ajouter dans les 3 locales).

## Agents Claude disponibles

- **`e2e-flaky-detector`** : analyse les tests Playwright pour repérer
  les patterns de fragilité (race conditions, assertions fragiles,
  storage async sans await).
- **`code-deduplicator`** : scanne `src/` via le skill `jscpd`,
  présente un top 10 des duplications les plus douloureuses, applique
  le refacto choisi par l'utilisateur (extraction de hook/composant/util)
  avec garde-fous (compile, tests, revert si échec, commit atomique).
  L'agent lance lui-même `npx skills experimental_install` à chaque appel
  pour rester synchronisé sur `skills-lock.json`.

### Skill jscpd
- Installé via `npx skills add kucherenko/jscpd` (une fois, lockfile
  versionné dans `skills-lock.json`).
- Config projet dans `.jscpd.json` (pattern, ignore, formats).
- Le skill source est sous `.agents/skills/jscpd/` (gitignored), recréé
  à la demande par `npx skills experimental_install`.