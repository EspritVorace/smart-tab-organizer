/**
 * E2E Tests for the contextual onboarding pack suggestions (issue #433,
 * US-PA002 / US-PA003 / US-PA004).
 *
 * Covers:
 * - US-PA002: the onboarding hero becomes contextual when open tabs match a
 *   pack, listing the matching packs (with tab counts) pre-selected.
 * - US-PA002: fallback to the generic hero when no tab matches.
 * - US-PA002: persistent dismissal of the suggestions.
 * - US-PA003: the "Organize now" reward after a hero-initiated import.
 *
 * NOTE: these specs are written but not run automatically (per the issue, only
 * `pnpm test` runs on the touched scope; `pnpm test:e2e` is left to the user).
 *
 * Matching tabs are produced by routing `https://github.com/**` to a local
 * stub so the created tabs carry a real domain matching the `pk-dev-github`
 * pack (`domainFilter: "github.com"`), without any network access.
 */
import type { BrowserContext, Page } from '@playwright/test';
import { test, expect } from './fixtures';
import { goToOptionsPage } from './helpers/navigation';
import { clearExtensionStorage } from '../../e2e-shared/actions/index.js';
import { ImportWizardPage } from '../../e2e-shared/pages/index.js';

const STUB_HTML = '<!doctype html><html><head><title>GitHub</title></head><body>stub</body></html>';

/** Serve any github.com URL as a local stub so created tabs match the pack. */
async function routeGithubStub(context: BrowserContext): Promise<void> {
  await context.route('https://github.com/**', (route) => {
    route.fulfill({ contentType: 'text/html', body: STUB_HTML });
  });
}

/** Wait for the home page to finish loading (settings resolved). */
async function waitForHomeLoaded(page: Page): Promise<void> {
  await page.waitForFunction(
    () => {
      const body = document.body.textContent ?? '';
      return !body.includes('Chargement') && body.length > 50;
    },
    null,
    { timeout: 10_000 },
  );
}

test.describe('Onboarding pack suggestions (US-PA002/003/004)', () => {
  test.beforeEach(async ({ extensionContext }) => {
    await clearExtensionStorage(extensionContext);
  });

  test('contextual hero lists packs matching open tabs, pre-selected', async ({
    extensionContext,
    extensionId,
    helpers,
  }) => {
    await routeGithubStub(extensionContext);
    // Two github tabs clear the minimum-tabs threshold (>= 2).
    await helpers.createTab('https://github.com/owner/repo');
    await helpers.createTab('https://github.com/owner/repo/issues');

    const page = await extensionContext.newPage();
    await goToOptionsPage(page, extensionId);
    await waitForHomeLoaded(page);

    // The GitHub pack suggestion is visible with its matched-tab count.
    const item = page.getByTestId('home-hero-suggest-item-pk-dev-github');
    await expect(item).toBeVisible();
    await expect(item).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('home-hero-suggest-import')).toBeVisible();
    // The generic hero is not rendered while suggestions are shown.
    await expect(page.getByTestId('home-hero-import')).toHaveCount(0);
  });

  test('falls back to the generic hero when no tab matches', async ({
    extensionContext,
    extensionId,
  }) => {
    const page = await extensionContext.newPage();
    await goToOptionsPage(page, extensionId);
    await waitForHomeLoaded(page);

    await expect(page.getByTestId('home-hero-import')).toBeVisible();
    await expect(page.getByTestId('home-hero-suggest-import')).toHaveCount(0);
  });

  test('dismissing the suggestions is persistent', async ({
    extensionContext,
    extensionId,
    helpers,
  }) => {
    await routeGithubStub(extensionContext);
    await helpers.createTab('https://github.com/a');
    await helpers.createTab('https://github.com/b');

    const page = await extensionContext.newPage();
    await goToOptionsPage(page, extensionId);
    await waitForHomeLoaded(page);
    await expect(page.getByTestId('home-hero-suggest-import')).toBeVisible();

    await page.getByTestId('home-hero-suggest-dismiss').click();
    // After dismissal the generic hero takes over.
    await expect(page.getByTestId('home-hero-import')).toBeVisible();

    // The dismissal survives a reload (stored in storage.local).
    await page.reload();
    await waitForHomeLoaded(page);
    await expect(page.getByTestId('home-hero-import')).toBeVisible();
    await expect(page.getByTestId('home-hero-suggest-import')).toHaveCount(0);
  });

  test('import and organize surfaces the "Organize now" reward', async ({
    extensionContext,
    extensionId,
    helpers,
  }) => {
    await routeGithubStub(extensionContext);
    await helpers.createTab('https://github.com/a');
    await helpers.createTab('https://github.com/b');

    const page = await extensionContext.newPage();
    await goToOptionsPage(page, extensionId);
    await waitForHomeLoaded(page);

    await page.getByTestId('home-hero-suggest-import').click();

    // The import wizard opens in pack mode with the suggestion pre-selected.
    const wizard = new ImportWizardPage(page);
    await wizard.clickNext();
    await wizard.confirmImport();

    // The reward dialog is offered; organizing announces its outcome.
    const reward = page.getByTestId('organize-reward-dialog');
    await expect(reward).toBeVisible();
    await page.getByTestId('organize-reward-organize').click();
    await expect(page.getByTestId('organize-reward-result')).not.toBeEmpty();
  });
});
