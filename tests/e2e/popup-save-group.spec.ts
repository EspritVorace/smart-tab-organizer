/**
 * E2E tests for the contextual Save button in the popup.
 * Covers: US-PO006 (single contextual button) and US-PO007 (group snapshot deep link + callout).
 *
 * Note: The popup Save button action depends on the active tab being in a Chrome
 * tab group at the moment the popup opens. In Playwright, opening popup.html as a
 * new tab makes itself the active tab (not in any group), so we test that case directly.
 * The group pre-selection flow and callout are tested via the options page deep link.
 */
import { test, expect } from './fixtures';
import { goToPopup } from './helpers/navigation';
import { clearSessions } from './helpers/seed';
import type { BrowserContext } from '@playwright/test';

test.beforeEach(async ({ extensionContext }) => {
  await clearSessions(extensionContext);
  await closeAllCapturableTabs(extensionContext);
});

// A non-system URL that captures correctly (about: is filtered by isSystemUrl)
const CAPTURABLE_URL = 'https://example.com';

/**
 * Close every non-system tab in the extension context. Prevents pollution of
 * `chrome.tabs.query({ currentWindow: true })` between tests, which is critical
 * for callout-presence assertions in the SnapshotWizard tests.
 */
async function closeAllCapturableTabs(extensionContext: BrowserContext): Promise<void> {
  const sw = extensionContext.serviceWorkers()[0];
  if (!sw) return;
  await sw.evaluate(async () => {
    const SYSTEM_URL_PREFIXES = [
      'chrome://',
      'chrome-extension://',
      'moz-extension://',
      'about:',
      'edge://',
    ];
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (!tab.id) continue;
      const url = tab.url ?? '';
      const isSystem = !url || SYSTEM_URL_PREFIXES.some(p => url.startsWith(p));
      if (!isSystem) {
        try {
          await chrome.tabs.remove(tab.id);
        } catch {
          // ignore: tab may have been removed concurrently
        }
      }
    }
  });
}

// ---------------------------------------------------------------------------
// Helper: create a tab group in the browser via service worker
// ---------------------------------------------------------------------------
async function createTabGroupWithTitle(
  extensionContext: BrowserContext,
  title: string,
  color: string = 'blue',
): Promise<{ groupId: number; tabId: number }> {
  const sw = extensionContext.serviceWorkers()[0];

  // Use a real (non-system) URL so captureCurrentTabs() includes it
  const result = await sw.evaluate(
    async ({ url, title, color }: { url: string; title: string; color: string }) => {
      const tab = await chrome.tabs.create({ url, active: false });
      const groupId = await chrome.tabs.group({ tabIds: [tab.id!] });
      await (chrome as any).tabGroups.update(groupId, { title, color });
      return { groupId, tabId: tab.id! };
    },
    { url: CAPTURABLE_URL, title, color },
  );
  return result;
}

async function createTab(extensionContext: BrowserContext, url: string): Promise<number> {
  const sw = extensionContext.serviceWorkers()[0];
  const tabId = await sw.evaluate(async (u: string) => {
    const tab = await chrome.tabs.create({ url: u, active: false });
    return tab.id!;
  }, url);
  return tabId;
}

async function closeTab(extensionContext: BrowserContext, tabId: number): Promise<void> {
  const sw = extensionContext.serviceWorkers()[0];
  await sw.evaluate(async (id: number) => {
    await chrome.tabs.remove(id);
  }, tabId);
}

// ---------------------------------------------------------------------------
// US-PO006 — Popup Save button stays a simple button (no SplitButton anymore)
// ---------------------------------------------------------------------------
test.describe('[US-PO006] Popup save button', () => {
  test('shows a single Save button when active tab is not in a group', async ({
    extensionContext,
    extensionId,
  }) => {
    const page = await extensionContext.newPage();
    await goToPopup(page, extensionId);

    // The popup page itself is the active tab (not in any group)
    await expect(page.getByRole('button', { name: /save session/i })).toBeVisible();
    // The legacy SplitButton chevron must never be present anymore
    await expect(page.getByRole('button', { name: /more save options/i })).toHaveCount(0);
    // No "Save all tabs" / dropdown menu items either
    await expect(page.getByRole('menuitem', { name: /save all tabs/i })).toHaveCount(0);
    await page.close();
  });

  test('Save button click navigates to snapshot wizard without groupId when not in a group', async ({
    extensionContext,
    extensionId,
  }) => {
    // Create a capturable (non-system) tab so canSave becomes true
    const tabId = await createTab(extensionContext, CAPTURABLE_URL);

    const page = await extensionContext.newPage();
    await goToPopup(page, extensionId);

    const saveBtn = page.getByRole('button', { name: /save session/i });
    await expect(saveBtn).toBeEnabled({ timeout: 5000 });

    const [newPage] = await Promise.all([
      extensionContext.waitForEvent('page'),
      saveBtn.click(),
    ]);
    await newPage.waitForLoadState('domcontentloaded');
    expect(newPage.url()).toContain('options.html');
    expect(newPage.url()).toContain('action=snapshot');
    expect(newPage.url()).not.toContain('groupId');

    await page.close();
    await newPage.close();
    await closeTab(extensionContext, tabId);
  });
});

// ---------------------------------------------------------------------------
// US-PO007 — Deep link: snapshot wizard pre-selects group tabs
// ---------------------------------------------------------------------------
test.describe('[US-PO007] Save active tab group via deep link', () => {
  test('#sessions?action=snapshot&groupId opens wizard with group name as default session name', async ({
    extensionContext,
    extensionId,
  }) => {
    const { groupId, tabId } = await createTabGroupWithTitle(extensionContext, 'Work Tabs', 'blue');

    try {
      const page = await extensionContext.newPage();
      await page.goto(
        `chrome-extension://${extensionId}/options.html#sessions?action=snapshot&groupId=${groupId}`,
      );
      await page.waitForLoadState('domcontentloaded');

      // Wait for the wizard dialog to open
      await page.getByTestId('wizard-snapshot').waitFor({ state: 'visible', timeout: 10_000 });
      await expect(page.getByText('Save Session Snapshot')).toBeVisible();

      // Default session name should be the group title
      const nameInput = page.getByTestId('wizard-snapshot-field-name');
      await expect(nameInput).toHaveValue('Work Tabs');

      await page.close();
    } finally {
      await closeTab(extensionContext, tabId);
    }
  });

  test('#sessions?action=snapshot&groupId with untitled group uses default Snapshot name', async ({
    extensionContext,
    extensionId,
  }) => {
    const { groupId, tabId } = await createTabGroupWithTitle(extensionContext, '', 'red');

    try {
      const page = await extensionContext.newPage();
      await page.goto(
        `chrome-extension://${extensionId}/options.html#sessions?action=snapshot&groupId=${groupId}`,
      );
      await page.waitForLoadState('domcontentloaded');

      await page.getByTestId('wizard-snapshot').waitFor({ state: 'visible', timeout: 10_000 });

      // Empty group title → fallback to "Snapshot <date>"
      const nameInput = page.getByTestId('wizard-snapshot-field-name');
      const value = await nameInput.inputValue();
      expect(value).toMatch(/^Snapshot /);

      await page.close();
    } finally {
      await closeTab(extensionContext, tabId);
    }
  });

  test('#sessions?action=snapshot with unknown groupId falls back to all tabs selected', async ({
    extensionContext,
    extensionId,
  }) => {
    const page = await extensionContext.newPage();
    // Use a groupId that certainly doesn't exist (very large number)
    await page.goto(
      `chrome-extension://${extensionId}/options.html#sessions?action=snapshot&groupId=999999`,
    );
    await page.waitForLoadState('domcontentloaded');

    await page.getByTestId('wizard-snapshot').waitFor({ state: 'visible', timeout: 10_000 });

    // Should fallback to default snapshot name (not a group name)
    const nameInput = page.getByTestId('wizard-snapshot-field-name');
    const value = await nameInput.inputValue();
    expect(value).toMatch(/^Snapshot /);

    // Fallback path: no callout
    await expect(page.getByTestId('wizard-snapshot-group-callout')).toHaveCount(0);

    await page.close();
  });

  test('#sessions?action=snapshot without groupId shows all tabs (original behavior)', async ({
    extensionContext,
    extensionId,
  }) => {
    const page = await extensionContext.newPage();
    await page.goto(
      `chrome-extension://${extensionId}/options.html#sessions?action=snapshot`,
    );
    await page.waitForLoadState('domcontentloaded');

    await page.getByTestId('wizard-snapshot').waitFor({ state: 'visible', timeout: 10_000 });
    await expect(page.getByText('Save Session Snapshot')).toBeVisible();

    // Default name should be "Snapshot <date>"
    const nameInput = page.getByTestId('wizard-snapshot-field-name');
    const value = await nameInput.inputValue();
    expect(value).toMatch(/^Snapshot /);

    // "Save all" path: no callout
    await expect(page.getByTestId('wizard-snapshot-group-callout')).toHaveCount(0);

    await page.close();
  });

  test('shows the group callout when preselection is strictly partial', async ({
    extensionContext,
    extensionId,
  }) => {
    // Window contains: 1 group with 1 tab + 1 ungrouped capturable tab.
    // The wizard will pre-select only the group tab → strictly partial → callout visible.
    const { groupId, tabId: groupTabId } = await createTabGroupWithTitle(
      extensionContext,
      'Active group',
      'green',
    );
    const ungroupedTabId = await createTab(extensionContext, 'https://example.org');

    try {
      const page = await extensionContext.newPage();
      await page.goto(
        `chrome-extension://${extensionId}/options.html#sessions?action=snapshot&groupId=${groupId}`,
      );
      await page.waitForLoadState('domcontentloaded');

      await page.getByTestId('wizard-snapshot').waitFor({ state: 'visible', timeout: 10_000 });
      await expect(page.getByTestId('wizard-snapshot-group-callout')).toBeVisible();

      await page.close();
    } finally {
      await closeTab(extensionContext, groupTabId);
      await closeTab(extensionContext, ungroupedTabId);
    }
  });

  test('hides the group callout when window only contains the active group', async ({
    extensionContext,
    extensionId,
  }) => {
    // Window contains only the group tab → preselection covers everything → no callout.
    // (Plus the wizard tab itself, but it is a chrome-extension URL filtered by isSystemUrl.)
    const { groupId, tabId } = await createTabGroupWithTitle(
      extensionContext,
      'Solo group',
      'orange',
    );

    try {
      const page = await extensionContext.newPage();
      await page.goto(
        `chrome-extension://${extensionId}/options.html#sessions?action=snapshot&groupId=${groupId}`,
      );
      await page.waitForLoadState('domcontentloaded');

      await page.getByTestId('wizard-snapshot').waitFor({ state: 'visible', timeout: 10_000 });
      // Wait for the async capture to settle (group title populated) before
      // asserting on callout presence to avoid racing the initial render.
      await expect(page.getByTestId('wizard-snapshot-field-name')).toHaveValue('Solo group');
      await expect(page.getByTestId('wizard-snapshot-group-callout')).toHaveCount(0);

      await page.close();
    } finally {
      await closeTab(extensionContext, tabId);
    }
  });
});
