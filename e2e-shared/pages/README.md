# `e2e-shared/pages/`

Page Objects shared between the two Playwright pipelines:

- `tests/e2e/` (functional suite, runs on every PR),
- `e2e-doc-scenarios/` (narrative captures, runs in its own workflow).

Each Page Object wraps a single UI surface (a dialog, a section of the
options page, a popup view) and exposes **atomic** building blocks:
locators, atomic actions, atomic assertions. Composition (full user
journeys) belongs to `e2e-shared/actions/`, which consumes Page Objects.

## When to create a Page Object

Create a new Page Object when:

- the same UI surface is exercised by more than one spec or scenario, or
- the surface is non-trivial enough that inline `page.getByRole(...)`
  calls would clutter the spec.

A typical Page Object is **one class per dialog or per page section**.
Splitting per step (`SourceStep`, `ClassificationStep`, ...) is fine when
the steps each carry significant state, but the default is one class per
visible surface.

## Naming convention

- File: PascalCase, suffixed with the surface kind
  (`ImportWizardPage.ts`, `DialogPage.ts`, `PopupPage.ts`).
- Class: same as the file (`ImportWizardPage`).
- Methods:
  - **Locators**: nouns, returned as `Locator`
    (`textArea()`, `nextButton()`, `errorBanner()`).
  - **Atomic actions**: verbs, returning `Promise<void>`
    (`selectTextMode()`, `pasteJson(json)`, `clickNext()`,
    `confirmImport()`, `cancel()`).
  - **Atomic assertions**: prefixed with `expect`, returning
    `Promise<void>` (`expectVisible()`, `expectInvalidJsonError()`,
    `expectClassification({ new, conflicting, identical })`).

Keep method bodies short. If you reach for orchestration logic
(seeding storage, opening a wizard from a page, asserting toasts after a
form submission), it probably belongs in `e2e-shared/actions/`.

## Dialog Page Objects

Subclass `DialogPage` (declared in this folder). It exposes:

- `dialog()`: root locator, defaulting to `page.getByRole('dialog')`,
- `expectVisible()` / `expectHidden()`: parameterised waits,
- `clickButton(name: RegExp | string)`: footer button shortcut.

Override `dialog()` in your subclass when **more than one dialog can be
visible at a time** (nested confirmation, error overlay, ...) so each
Page Object scopes its locators to its own dialog:

```ts
export class ConfirmDialogPage extends DialogPage {
  override dialog(): Locator {
    // Pick the topmost dialog when nested.
    return this.page.getByRole('dialog').last();
  }
}
```

## Template

Copy/paste this skeleton for a new dialog Page Object:

```ts
import { expect, type Locator, type Page } from '@playwright/test';
import { DialogPage } from './DialogPage.js';

export class MyWizardPage extends DialogPage {
  constructor(page: Page) {
    super(page);
  }

  // ─── Locators ────────────────────────────────────────────────────────────
  primaryButton(): Locator {
    return this.dialog().getByRole('button', { name: /save/i });
  }

  // ─── Atomic actions ──────────────────────────────────────────────────────
  async clickPrimary(): Promise<void> {
    await this.primaryButton().click();
  }

  // ─── Atomic assertions ───────────────────────────────────────────────────
  async expectPrimaryEnabled(): Promise<void> {
    await expect(this.primaryButton()).toBeEnabled();
  }
}
```

Don't forget to re-export the new class from `index.ts`.

## Imports

Use **explicit relative imports with the `.js` extension**, in line with
the existing `e2e-shared/extension-loader.ts`, `e2e-shared/extension-id.ts`,
etc.:

```ts
import { ImportWizardPage } from '../../e2e-shared/pages/ImportWizardPage.js';
// or, via the barrel:
import { ImportWizardPage } from '../../e2e-shared/pages/index.js';
```

No path alias is configured for `e2e-shared/`; relative imports keep the
two Playwright pipelines symmetrical and let `tsc --noEmit` resolve the
files without extra configuration.
