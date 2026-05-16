# `tests/e2e/` — Playwright functional suite

Functional E2E suite that loads the built Chrome MV3 extension into a
persistent Chromium context, drives the popup / options pages, and
asserts behavior end-to-end.

Sister pipeline `e2e-doc-scenarios/` reuses the same Page Objects and
matchers (see `e2e-shared/`).

## Running

```bash
pnpm test:e2e            # build + run
pnpm test:e2e:ui         # UI mode (debug)
pnpm test:e2e:headed     # headed (default; extensions cannot run headless)
```

## Fixtures

Defined in `fixtures.ts`. Import via:

```ts
import { test, expect } from './fixtures';
```

| Fixture            | Scope    | Purpose                                                                 |
|--------------------|----------|-------------------------------------------------------------------------|
| `extensionContext` | worker   | Persistent `BrowserContext` with the extension loaded.                  |
| `extensionId`      | worker   | Chrome-assigned ID of the loaded extension.                             |
| `extensionPage`    | **test** | Fresh `Page` per test, auto-closed (with "last page" guard, see below). |
| `popupPage`        | test     | Pre-navigated to `popup.html`.                                          |
| `optionsPage`      | test     | Pre-navigated to `options.html`.                                        |
| `helpers`          | test     | Domain helpers (rules, tabs, statistics, grouping waits, ...).          |

### When to use `extensionPage`

Default to `extensionPage` for any single-page spec. It removes the
boilerplate `const page = await extensionContext.newPage()` /
`await page.close()` pair that pollutes most existing tests and is the
root cause of the `last-page-browser-exit` flake pattern documented in
`.claude/agents/e2e-flaky-detector.md`.

```ts
test('rule import shows an in-page toast', async ({
  extensionId,
  extensionPage,
}) => {
  await goToImportExportSection(extensionPage, extensionId);
  // ...
  await expect(extensionPage).toHaveToast('success');
});
```

Keep using `extensionContext.newPage()` directly when a test needs more
than one page at the same time (sessions, deduplication, multi-window
flows). No forced migration: existing specs continue to work.

### "Last page" guard

The teardown of `extensionPage` refuses to close the page when it is
the only one left in the context. Closing the last page closes the
persistent context, which terminates the worker and breaks every
subsequent test in the same worker. The guard, paired with a silent
`isClosed()` check, makes the fixture safe even when the test itself
closes the page.

## Custom matchers

Registered globally via `e2e-shared/matchers/register.ts` (side-effect
import from `fixtures.ts`). All five matchers poll the target until it
matches (`expect.poll`-style) so they tolerate the async writes
performed by `chrome.storage.local` and the React commit phase. No
`waitForTimeout` is used.

### Storage-backed assertions (`BrowserContext`)

```ts
// After an import, assert that one rule made it to storage.
await expect(extensionContext).toHaveDomainRulesCount(1);

// After a snapshot, assert the sessions array gained one entry.
await expect(extensionContext).toHaveSessionsCount(1);

// Statistics fields are addressed by name.
await expect(extensionContext).toHaveStatistic('tabGroupsCreatedCount', 1);
await expect(extensionContext).toHaveStatistic('tabsDeduplicatedCount', 2);
```

### UI assertions (`Page`)

```ts
// Assert any Radix dialog is visible.
await expect(extensionPage).toHaveDialogOpen();

// Optionally filter by accessible name (string or RegExp).
await expect(extensionPage).toHaveDialogOpen(/import rules/i);

// Assert a Radix Toast of the requested variant is visible.
await expect(extensionPage).toHaveToast('success');
await expect(extensionPage).toHaveToast('error');
await expect(extensionPage).toHaveToast('info');
```

The toast matcher targets the `data-testid="toast-${variant}"` rendered
by `src/components/UI/Toaster/Toaster.tsx`.

## Page Objects & actions

Shared between this suite and `e2e-doc-scenarios/`:

- `e2e-shared/pages/` — atomic Page Objects (locators + atomic actions +
  atomic assertions). See `e2e-shared/pages/README.md`.
- `e2e-shared/actions/` — composed flows (`importRulesViaText`, ...).
  Built on top of Page Objects.

## Conventions

- Never `waitForTimeout(...)` to "give it time". Prefer
  `expect(locator).toBeVisible({ timeout })`, the custom matchers
  above, or one of the polling helpers exposed by the `helpers`
  fixture (`waitForGrouping`, `waitForDeduplication`,
  `waitForTabTitle`, `waitForTabGrouped`).
- Never `console.log()` from specs; use the existing logger conventions
  if debugging output is genuinely needed.
- Group tests with `test.describe` only when a `beforeEach` is shared.
