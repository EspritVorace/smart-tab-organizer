# Clarifications - pipeline `e2e-doc-scenarios/` (issues #257, #259)

Decisions made before and during the implementation of the successive phases.

## Phase 1 scope (#257)

This PR covered:

- US-DS001 / US-DS002: main scenario `00-main-journey` in `en x dark` only (the matrix scaffold is ready but the PR did not yet run the 6 variants).
- US-DS004: mimetic local sites (GitHub, YouTube, Google, Le Monde).
- US-DS005: `ui-actions.ts` helpers.
- US-DS006: `captureStep()` with sequential counter.
- US-DS007: coexistence and factoring in `e2e-shared/`.
- US-DS008: README auto-generated per scenario.
- US-DS009: full migration of routing from `e2e-screenshots/` to manifests.

Deferred to later phases:

- US-DS003: 4 satellite scenarios (`10-import-conflicts`, `11-restore-conflicts`, `12-deduplication-modes`, `13-grouping-modes`).
- Full matrix 3 locales x 2 themes for the main scenario.
- US-DS010: `pnpm doc:scenarios:audit` command.
- US-DS011: `pnpm doc:scenarios:sync` command.

## Phase 2.1 scope (#259)

This phase extends the coverage:

- Full matrix: `playwright.doc.config.ts` generates 6 projects `{locale}-{theme}` (en/fr/es x dark/light); each project carries its parameters via `metadata: { locale, theme }`, read by the fixture (`doc-fixture.ts`) and by the scenario.
- The scenario reads locale and theme via the new fixtures `locale` / `theme` (worker-scoped) instead of inferring the locale from `project.name`.
- Additional captures added to the `00-main-journey` scenario:
  - `034-sessions-card-relative-time.png`
  - `035-sessions-card-hovercard.png`
  - `036-sessions-pin-onboarding.png` (popup pinned-empty hint)
  - `037-sessions-list-with-pinned.png`
  - `041-export-wizard-selection.png`
  - `042-export-toast-success.png` (via a `window.showSaveFilePicker` stub on the page side: a fake handle whose `write` / `close` are no-ops, the export goes through its success branch and emits the toast)
  - `043-import-wizard-paste.png`
  - `044-import-wizard-classification.png`
  - `050-rules-list-with-disabled.png`
  - `051-sessions-search-active.png`
  - `052-sessions-search-deep.png`
  - `060-rules-list-final.png` (renumbering: leaves 050 available for the disabled version).
- Stabilization helpers added: `waitForToast`, `hoverSessionCardName`, `pinSession`, `getFirstSessionId`, `toggleRuleEnabled`, `fillSessionsSearch`, `openExportRulesWizard`, `openImportRulesWizard`, `pasteImportJson`, `importWizardNextToClassification`.
- Small source addition: `data-testid="session-card-{id}-btn-pin"` / `-btn-unpin` on the pin/unpin button of `SessionCard`, to make selection more reliable without resorting to a locator by i18n aria-label.
- Testid wiring on the export wizard footer: `ExportWizardShell` now propagates `primaryTestId` / `clipboardTestId` / `cancelTestId` to `ExportWizardFooter` (already supported by `ExportSplitButton`). `ExportWizard` (rules) sets `wizard-export-rules-btn-{export,clipboard,cancel}` to allow 042 to click the primary button deterministically.

### Captures explicitly not delivered in Phase 2.1

- `014-rules-toast-created.png`: no in-app toast is emitted when creating a rule in the current codebase. To be re-evaluated if a `showSuccessToast` is added to `handleSubmitRule` (`src/pages/DomainRulesPage.tsx`).
- `023-toast-grouping-with-undo.png`: no in-app toast accompanies automatic grouping. The system notification (`chrome.notifications`) with Undo button stays OS-level (cf. Phase 1 decision) and cannot be captured by Playwright. To be revisited once an in-app toast is added.
- `031-sessions-snapshot-wizard-step2.png`: `SnapshotWizard` is single-step (cf. Phase 1 decision). Single capture kept (`030-sessions-snapshot-wizard-filled.png`).

## Technical decisions

### Mimetic local sites (US-DS004)

Chosen approach: **local DNS via Chromium `--host-resolver-rules`**.

The static HTTP server runs on `127.0.0.1:4173`. Chromium is launched with:

```
--host-resolver-rules=MAP github.com:80 127.0.0.1:4173, MAP youtube.com:80 127.0.0.1:4173, MAP google.com:80 127.0.0.1:4173, MAP lemonde.fr:80 127.0.0.1:4173, EXCLUDE localhost
```

Consequences:

- In the address bar, the user sees `http://github.com/repo-readme.html` (realistic).
- `chrome.tabs.url` returns the same URL: domain rules naturally match `github.com`, without adaptation.
- Everything stays offline and deterministic.

### Available configuration modes

The code exposes 3 modes (`preset`, `ask`, `manual`). The `label` mode mentioned in the issue does not exist in the current codebase: the `017-rules-wizard-step2-mode-label.png` capture is therefore removed from Phase 1. To be re-evaluated if a `label` mode is added later.

### Snapshot wizard steps

The `SnapshotWizard` is single-step in the current code: no breakdown into `step1-naming` / `step2-tab-selection` / `summary`. Single capture of the filled wizard (`030-sessions-snapshot-wizard-filled.png`).

### Factoring (US-DS007)

Common helpers in the `e2e-shared/` folder at the root:

- `chromium-finder.ts`: Chromium binary resolution (CI vs local).
- `extension-loader.ts`: shared `launchExtension()` (userDataDir, args, deterministic flags, host-resolver).
- `extension-id.ts`: `waitForServiceWorker()` + `getExtensionId()`.
- `locale-injector.ts`: `chrome.i18n.getMessage` override via `addInitScript`.
- `theme.ts`: `applyTheme(page, 'light' | 'dark')`.
- `sharp-save.ts`: `savePng()` with manifest-driven routing.
- `routing/types.ts`, `routing/destinations.ts`: types and roots of destinations.

The `tests/e2e/` and `e2e-screenshots/` pipelines consume these helpers, with no public API change.
