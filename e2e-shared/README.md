# `e2e-shared/`

Shared bundle of Playwright primitives consumed by every E2E pipeline of
the extension:

- `tests/e2e/` — functional suite (runs on every PR),
- `e2e-doc-scenarios/` — narrative captures (3 locales x 2 themes,
  separate workflow),
- `e2e-screenshots/` — Chrome Web Store captures (out of scope of the
  current convergence epic).

Lot 6 of the Page Objects + Domain Actions epic (issue #309) brought the
narrative capture pipeline onto the same primitives as the functional
suite, so an evolution of the extension's DOM breaks both at the same
call site. That is the central contract the layout below preserves.

## Layered architecture

```
e2e-shared/
  fixtures-base.ts      # worker-scoped extensionContext + extensionId
  extension-loader.ts   # persistent-context launcher (Chromium args, fonts)
  extension-id.ts       # service-worker readiness + ID resolution
  locale-injector.ts    # `--lang=` plus `chrome.i18n.getUILanguage` override
  theme.ts              # apply Radix theme via localStorage
  sharp-save.ts         # deterministic PNG flattening
  chromium-finder.ts    # local Chromium binary discovery
  routing/              # destination manifests for doc-scenarios output

  pages/                # Page Objects (atomic locators + actions)
    DialogPage.ts       # abstract base for Radix dialogs
    PopupPage.ts        # popup.html
    ImportWizardPage.ts # rules/sessions import wizard (Source + Classification)
    ExportWizardPageBase.ts   # shared toolbar + footer
    ExportWizardPage.ts       # rules-specific subclass
    SessionsExportWizardPage.ts  # sessions-specific subclass
    RuleWizardPage.ts   # create + edit rule wizard
    SnapshotWizardPage.ts        # session snapshot wizard
    RestoreWizardPage.ts         # session restore wizard
    OptionsEditModalPage.ts      # rule edit > Options sub-modal
    SessionsListPage.ts          # sessions page list
    DomainRulesListPage.ts       # rules page list

  actions/              # Composed Domain Actions (consume Page Objects)
    rules-import-export.ts       # open + import via text/file, export
    rules-management.ts          # open + create + edit a rule
    sessions-snapshot.ts         # open + take + pin
    sessions-restore.ts          # customize + replace + merge
    sessions-export.ts           # open + export sessions
    tabs-grouping.ts             # middle-click child + waitForGroupingSettled
    tabs-deduplication.ts        # expectTabDeduplicated + undo
    popup-actions.ts             # open popup + organize all tabs
    notifications.ts             # SW notification queries + undo
    storage-seed.ts              # clearExtensionStorage, seedDomainRules, seedSessions
    live-tab-group.ts            # createLiveTabGroup (chrome.tabGroups)
    toast.ts                     # waitForToast (Radix toast viewport)

  matchers/             # Custom Playwright matchers (`toHaveToast`, ...)
```

## Convention summary

### Page Objects (`pages/`)

- One class per UI surface (one dialog, one page, one sub-modal).
- Methods come in three flavours:
  - **Locators** (nouns): `nextButton()`, `tabList()`, `errorBanner()`.
  - **Atomic actions** (verbs): `clickNext()`, `pasteJson(json)`,
    `selectConfigMode(mode)`. One DOM gesture each.
  - **Atomic assertions** (`expect*`): `expectVisible()`,
    `expectInvalidJsonError()`, `expectOnStep(2)`.
- Dialog Page Objects subclass `DialogPage`. Override `dialog()` when
  several dialogs can co-exist (stacked modals).
- **Locale-agnostic by default**: anchor on `data-testid`, then on
  Radix-stable attributes (`[value="…"]`, `.rt-SegmentedControlItem`,
  `svg.lucide-…`), and only on `getByRole({ name })` regexes as a last
  resort. The narrative pipeline runs in `en`/`fr`/`es`; locale-sensitive
  selectors silently skew the captures.

### Domain Actions (`actions/`)

- Each function narrates a single business outcome ("import rules via
  text", "restore session as replace", "create a snapshot with these
  tabs"). Consumes Page Objects, never raw locators.
- Composition only — no DOM atoms. If a helper has to reach for
  `page.getByTestId(...)` directly, the missing piece belongs to a Page
  Object.
- Storage seeding and SW-only helpers (`storage-seed.ts`,
  `live-tab-group.ts`, `notifications.ts`) live here because they have
  the same "narrate one outcome" shape, even though they bypass the
  rendered UI.

### Custom matchers (`matchers/`)

- Add a matcher when an assertion is re-stated across more than two
  specs and the diff between specs is purely cosmetic
  (`toHaveDomainRulesCount`, `toHaveToast`). Registered once via
  `register.ts`, imported by `fixtures-base.ts` so every pipeline
  inherits them.

### Fixtures (`fixtures-base.ts`)

- Worker-scoped `extensionContext` and `extensionId`, parameterised by
  the launch options the pipeline returns from
  `resolveLaunchOptions(testInfo)`.
- Pipelines extend the base instead of redeclaring it:
  - `tests/e2e/fixtures.ts` extends to add `extensionPage`,
    `popupPage`, `optionsPage` and the `helpers` object.
  - `e2e-doc-scenarios/helpers/doc-fixture.ts` extends to add
    `docLocale`, `docTheme` and wires `hostResolverRules` for the
    mimetic-sites fixture server.
- Side-effect import of `matchers/register.js` lives once, in the base.

## Adding a new Page Object

1. Decide the surface (dialog, page section, sub-modal). One class.
2. Pick a file name in PascalCase ending with `Page`
   (`MyWizardPage.ts`). Extend `DialogPage` when it wraps a Radix
   dialog.
3. Add atomic locators (nouns), atomic actions (verbs), atomic
   assertions (`expect*`). Keep methods short; orchestration belongs in
   `actions/`.
4. Anchor on stable attributes (testids > Radix `[value]` > Lucide
   class > role with English regex as a fallback).
5. Re-export the class (and its types) from `pages/index.ts`.

## Composing a new Domain Action

1. Confirm the missing piece is genuinely a composition. If it is a DOM
   atom, add it to a Page Object instead.
2. Add the action to the matching `actions/<surface>.ts` file (or
   create a new module if the surface is new).
3. The function name should narrate the outcome
   (`restoreSessionAsReplace`, not `clickRestoreReplaceAndWait`).
4. Drive the flow via Page Object methods; never reach into
   `page.locator(...)`. If you have to, the missing piece is a Page
   Object method.
5. Re-export the function (and any new types) from `actions/index.ts`.

## When to add a custom matcher

- A matcher pulls its weight when the same assertion is duplicated
  across **three or more** specs and the diff is only the expected
  count or label. Below that bar, an inline `expect(...).toBe(...)` is
  more readable.
- Matchers go to `matchers/<name>.ts`, registered in
  `matchers/register.ts`. Provide good failure messages: Playwright's
  `toPass`/`toMatchAriaSnapshot` patterns are a useful reference.

## Notes on the narrative capture pipeline

`e2e-doc-scenarios/` runs the same scenarios across three locales and
two themes. The capture-specific helpers (locale-aware page opening,
mimetic-tab spawn, capture-step counter, scenario README writer) live
in `e2e-doc-scenarios/helpers/`. **Anything UI-driving has to come from
`e2e-shared/`.** A locale-sensitive selector in a shared Page Object is
a regression — please anchor on a stable attribute and add a comment if
no testid exists.
