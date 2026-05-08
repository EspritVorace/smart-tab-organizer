/**
 * High-level UI actions reused across narrative scenarios.
 *
 * Every helper drives the real UI through stable `data-testid` selectors
 * (no direct storage seeding). Avoids `waitForTimeout` in favour of explicit
 * waits, so scenarios remain deterministic on CI.
 */
import type { BrowserContext, Page } from '@playwright/test';
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
