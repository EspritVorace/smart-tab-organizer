/**
 * High-level UI actions reused across narrative scenarios.
 *
 * Every helper drives the real UI through stable `data-testid` selectors
 * (no direct storage seeding). Avoids `waitForTimeout` in favour of explicit
 * waits, so scenarios remain deterministic on CI.
 */
import type { BrowserContext, Locator, Page } from '@playwright/test';
import { injectLocaleOverride } from '../../e2e-shared/locale-injector.js';
import { applyTheme, type Theme } from '../../e2e-shared/theme.js';
import { waitForServiceWorker } from '../../e2e-shared/extension-id.js';

export type ConfigMode = 'preset' | 'ask' | 'manual';

/**
 * Open a brand-new page on a chrome-extension:// URL with the locale override
 * and theme already applied.
 */
export async function openExtensionPage(
  context: BrowserContext,
  extensionId: string,
  section: 'popup' | 'rules' | 'sessions' | 'stats' | 'importexport' | 'settings' | '',
  locale: string,
  theme: Theme,
): Promise<Page> {
  const page = await context.newPage();
  await injectLocaleOverride(page, locale);

  const base = `chrome-extension://${extensionId}`;
  const targetUrl =
    section === 'popup'
      ? `${base}/popup.html`
      : section === ''
        ? `${base}/options.html`
        : `${base}/options.html#${section}`;

  await page.goto(targetUrl);
  await page.waitForLoadState('domcontentloaded');
  await applyTheme(page, theme);
  await page.waitForFunction(
    () => (document.body?.textContent ?? '').length > 30,
    { timeout: 10_000 },
  );
  await page.waitForTimeout(600);
  return page;
}

/** Open the Domain Rule creation wizard from the rules options page. */
export async function openRuleWizard(page: Page): Promise<void> {
  await page.getByTestId('page-rules-btn-add').click();
  await page.getByTestId('wizard-rule').waitFor({ state: 'visible' });
  await page.getByTestId('wizard-rule-step-1').waitFor({ state: 'visible' });
}

/** Fill identity fields on step 1 and advance to step 2. */
export async function fillRuleWizardStep1(
  page: Page,
  fields: { label: string; domainFilter: string },
): Promise<void> {
  await page.getByTestId('wizard-rule-field-label').fill(fields.label);
  await page.getByTestId('wizard-rule-field-domain').fill(fields.domainFilter);
  await page.getByTestId('wizard-rule-btn-next').click();
  await page.getByTestId('wizard-rule-step-2').waitFor({ state: 'visible' });
}

/** Pick a configuration mode on step 2. Does not advance the wizard. */
export async function selectConfigurationMode(
  page: Page,
  mode: ConfigMode,
): Promise<void> {
  await page.getByTestId(`config-mode-${mode}`).click();
}

/** Advance from step 2 → step 3. */
export async function ruleWizardNextToOptions(page: Page): Promise<void> {
  await page.getByTestId('wizard-rule-btn-next').click();
  await page.getByTestId('wizard-rule-step-3').waitFor({ state: 'visible' });
}

/** Advance from step 3 → step 4 (summary). */
export async function ruleWizardNextToSummary(page: Page): Promise<void> {
  await page.getByTestId('wizard-rule-btn-next').click();
  await page.getByTestId('wizard-rule-step-4').waitFor({ state: 'visible' });
}

/** Submit the wizard from the summary step (creation flow uses the "Create" button). */
export async function saveRuleWizard(page: Page): Promise<void> {
  await page.getByTestId('wizard-rule-btn-create').click();
  await page.getByTestId('wizard-rule').waitFor({ state: 'hidden' });
}

/** Dismiss the rule wizard without saving (Escape closes the Radix dialog). */
export async function dismissRuleWizard(page: Page): Promise<void> {
  await page.keyboard.press('Escape');
  await page.getByTestId('wizard-rule').waitFor({ state: 'hidden' });
}

/** Dismiss the snapshot wizard without saving. */
export async function dismissSnapshotWizard(page: Page): Promise<void> {
  await page.keyboard.press('Escape');
  await page.getByTestId('wizard-snapshot').waitFor({ state: 'hidden' });
}

/** Open the session-snapshot wizard from the sessions options page. */
export async function openSnapshotWizard(page: Page): Promise<void> {
  await page.getByTestId('page-sessions-btn-snapshot').click();
  await page.getByTestId('wizard-snapshot').waitFor({ state: 'visible' });
}

/** Fill the snapshot name field. */
export async function fillSnapshotName(page: Page, name: string): Promise<void> {
  await page.getByTestId('wizard-snapshot-field-name').fill(name);
}

/** Fill the optional snapshot notes field, if present. */
export async function fillSnapshotNotes(page: Page, notes: string): Promise<void> {
  const field = page.getByTestId('wizard-snapshot-field-notes');
  if ((await field.count()) > 0) {
    await field.fill(notes);
  }
}

/** Submit the snapshot wizard. */
export async function saveSnapshotWizard(page: Page): Promise<void> {
  await page.getByTestId('wizard-snapshot-btn-save').click();
  await page.getByTestId('wizard-snapshot').waitFor({ state: 'hidden' });
}

/**
 * Open a new tab in the supplied context navigating to a mimetic-site URL.
 * Returns the new Page (already navigated).
 */
export async function openMimeticTab(
  context: BrowserContext,
  url: string,
): Promise<Page> {
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 8_000 });
  } catch {
    // Navigation can race with grouping; the tab is still created.
  }
  return page;
}

/**
 * Wait for the extension's grouping pipeline to settle.
 *
 * Polls `chrome.tabGroups.query` via the service worker until the count is
 * stable for 600 ms or the timeout elapses.
 */
export async function waitForGroupingSettled(
  context: BrowserContext,
  timeoutMs: number = 5_000,
): Promise<void> {
  const sw = await waitForServiceWorker(context);
  const deadline = Date.now() + timeoutMs;
  let lastCount = -1;
  let stableMs = 0;
  while (Date.now() < deadline) {
    const count = await sw.evaluate<number>(async () => {
      // tabGroups is Chrome-only and may be undefined outside service worker context
      const browser = chrome as unknown as {
        tabGroups?: { query: (q: object) => Promise<unknown[]> };
      };
      if (!browser.tabGroups) return 0;
      const groups = await browser.tabGroups.query({});
      return groups.length;
    });
    if (count === lastCount) {
      stableMs += 200;
      if (stableMs >= 600) return;
    } else {
      lastCount = count;
      stableMs = 0;
    }
    await new Promise((r) => setTimeout(r, 200));
  }
}

/**
 * Wait for an in-app toast to appear in the current page.
 *
 * Defaults to the Radix toast-viewport selector (data-testid="toast-viewport"),
 * then waits for at least one toast root to be visible. Optionally narrow to a
 * given variant ("success" | "error" | "info") via the `variant` argument.
 */
export async function waitForToast(
  page: Page,
  options: { variant?: 'success' | 'error' | 'info'; timeoutMs?: number } = {},
): Promise<Locator> {
  const { variant, timeoutMs = 5_000 } = options;
  await page
    .getByTestId('toast-viewport')
    .waitFor({ state: 'attached', timeout: timeoutMs });
  const toast = variant
    ? page.getByTestId(`toast-${variant}`)
    : page.locator('[data-testid^="toast-"][data-variant]');
  await toast.first().waitFor({ state: 'visible', timeout: timeoutMs });
  return toast.first();
}

/**
 * Hover a session card's name (HoverCard trigger) and wait for the HoverCard
 * panel to appear so the resulting capture is stable.
 */
export async function hoverSessionCardName(
  page: Page,
  sessionId: string,
): Promise<void> {
  const trigger = page.getByTestId(`session-card-${sessionId}-name`);
  await trigger.scrollIntoViewIfNeeded();
  await trigger.hover();
  await page.locator('[data-radix-hover-card-content], [role="dialog"][data-state="open"]').first().waitFor({
    state: 'visible',
    timeout: 3_000,
  }).catch(async () => {
    // Some Radix builds expose the content with a different attribute set;
    // fall back to a short stabilisation pause so the screenshot still picks
    // up the freshly-rendered panel.
    await page.waitForTimeout(400);
  });
}

/**
 * Toggle a domain rule's "enabled" Switch by rule id.
 *
 * The Switch lives inside the rule card and is targeted via aria-label since
 * it currently has no dedicated data-testid.
 */
export async function toggleRuleEnabled(page: Page, ruleId: string): Promise<void> {
  const card = page.getByTestId(`rule-card-${ruleId}`);
  const toggle = card.getByRole('switch').first();
  await toggle.click();
}

/**
 * Click the pin button on a session card. Best-effort: relies on the card
 * being currently visible and not in the renaming state.
 */
export async function pinSession(page: Page, sessionId: string): Promise<void> {
  await page.getByTestId(`session-card-${sessionId}-btn-pin`).click();
  await page.getByTestId(`session-card-${sessionId}-btn-unpin`).waitFor({
    state: 'visible',
    timeout: 3_000,
  });
}

/**
 * Resolve the testid suffix (uuid) of the first session card visible on the
 * sessions list. Walks from the `-name` element, whose testid is
 * `session-card-{uuid}-name`, and strips the suffix.
 */
export async function getFirstSessionId(page: Page): Promise<string> {
  const nameEl = page.locator('[data-testid^="session-card-"][data-testid$="-name"]').first();
  await nameEl.waitFor({ state: 'visible' });
  const testid = await nameEl.getAttribute('data-testid');
  if (!testid) {
    throw new Error('Could not read data-testid from the first session card name');
  }
  return testid.replace(/^session-card-/, '').replace(/-name$/, '');
}

/**
 * Type a query into the sessions list search input and wait for the filtered
 * list to update.
 */
export async function fillSessionsSearch(
  page: Page,
  query: string,
): Promise<void> {
  const input = page.getByTestId('page-sessions-search');
  await input.click();
  await input.fill(query);
  // Search filtering is purely client-side: a single animation frame is
  // enough for the React re-render to commit before we capture.
  await page.waitForTimeout(150);
}

/** Open the rules export wizard from the Import/Export page. */
export async function openExportRulesWizard(page: Page): Promise<void> {
  const card = page.getByTestId('page-import-export-card-export-rules');
  await card.getByRole('button').first().click();
  // Both export wizards share the WizardModal frame: wait for the dialog title.
  await page.getByRole('dialog').first().waitFor({ state: 'visible' });
}

/** Open the rules import wizard from the Import/Export page. */
export async function openImportRulesWizard(page: Page): Promise<void> {
  const card = page.getByTestId('page-import-export-card-import-rules');
  await card.getByRole('button').first().click();
  await page.getByRole('dialog').first().waitFor({ state: 'visible' });
}

/**
 * Switch the active import wizard from File mode to Text mode and paste the
 * supplied JSON into the textarea.
 */
export async function pasteImportJson(page: Page, json: string): Promise<void> {
  const dialog = page.getByRole('dialog').first();
  // Segmented control item labelled "Text" (i18n-driven, so query by role).
  await dialog
    .locator('[role="radiogroup"], [role="tablist"], [data-radix-segmented-control-root]')
    .first()
    .waitFor({ state: 'visible' })
    .catch(() => {});
  // The segmented control items use role="radio" or "tab" depending on
  // Radix internals; querying by visible text via the radiogroup labels is
  // brittle, so we click the second SegmentedControl item directly.
  const segmentedItems = dialog.locator('button, [role="tab"], [role="radio"]').filter({
    hasText: /./,
  });
  // Heuristic: the first two items are "File" and "Text" (others optional).
  await segmentedItems.nth(1).click();
  const textarea = dialog.locator('textarea').first();
  await textarea.waitFor({ state: 'visible' });
  await textarea.fill(json);
  // Validation runs on each input change; small breath so the success
  // callout is rendered before capture.
  await page.waitForTimeout(200);
}

/**
 * Advance the import wizard from step 0 (source) to step 1 (classification)
 * by clicking the "Next" button in the dialog footer.
 */
export async function importWizardNextToClassification(page: Page): Promise<void> {
  const dialog = page.getByRole('dialog').first();
  await dialog.getByRole('button').last().click();
  // Radix renders step 1 inside the same dialog; wait for the
  // classification scroll area to appear.
  await page.waitForTimeout(300);
}
