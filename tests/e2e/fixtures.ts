import { test as base, chromium, type BrowserContext, type Page } from '@playwright/test';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';
import * as os from 'os';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Extension path relative to project root
const EXTENSION_PATH = path.join(__dirname, '../../.output/chrome-mv3');

export interface ExtensionFixtures {
  extensionContext: BrowserContext;
  extensionId: string;
  popupPage: Page;
  optionsPage: Page;
}

export interface ExtensionHelpers {
  // Settings management
  setGlobalGroupingEnabled: (enabled: boolean) => Promise<void>;
  setGlobalDeduplicationEnabled: (enabled: boolean) => Promise<void>;
  addDomainRule: (rule: DomainRuleConfig) => Promise<void>;
  clearDomainRules: () => Promise<void>;
  getSettings: () => Promise<any>;

  // Tab operations
  createTab: (url: string) => Promise<Page>;
  createTabFromOpener: (openerPage: Page, url: string) => Promise<Page>;
  /**
   * Creates a tab that triggers the FULL natural event-handler flow:
   * injects into middleClickedTabs (simulates content script's auxclick/contextmenu handler)
   * → chrome.tabs.create({ openerTabId }) → onTabCreated → findMiddleClickOpener
   * → handleGroupingWithRetry → onUpdated(complete) → processGroupingForNewTab
   */
  createTabNaturally: (openerPage: Page, url: string) => Promise<Page>;
  getTabCount: () => Promise<number>;
  getTabGroups: () => Promise<TabGroupInfo[]>;
  closeAllTestTabs: () => Promise<void>;
  /** Ungroups every tab group in the current window — prevents leftover groups bleeding between tests. */
  clearAllTabGroups: () => Promise<void>;

  // Utilities
  waitForDeduplication: (timeoutMs?: number) => Promise<void>;
  waitForGrouping: (timeoutMs?: number) => Promise<void>;
  /**
   * Polls until at least one group exists (or the expected group title appears).
   * More reliable than a fixed sleep for grouping assertions.
   */
  waitForTabGrouped: (expectedTitle?: string, timeoutMs?: number) => Promise<TabGroupInfo[]>;
  getStatistics: () => Promise<Statistics>;
  resetStatistics: () => Promise<void>;
}

export interface DomainRuleConfig {
  label: string;
  domainFilter: string;
  enabled?: boolean;
  groupingEnabled?: boolean;
  deduplicationEnabled?: boolean;
  deduplicationMatchMode?: 'exact' | 'includes';
  color?: string;
  groupNameSource?: 'label' | 'title' | 'url' | 'manual' | 'smart' | 'smart_label' | 'smart_preset' | 'smart_manual';
  titleParsingRegEx?: string;
  urlParsingRegEx?: string;
  presetId?: string;
}

export interface TabGroupInfo {
  id: number;
  title: string;
  color: string;
  tabCount: number;
  tabIds: number[];
}

export interface Statistics {
  tabGroupsCreatedCount: number;
  tabsDeduplicatedCount: number;
}

// Create a temporary user data directory for each test run
function createTempUserDataDir(): string {
  const tmpDir = path.join(os.tmpdir(), `playwright-chrome-${Date.now()}`);
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
  return tmpDir;
}

export const test = base.extend<ExtensionFixtures & { helpers: ExtensionHelpers }>({
  // Custom browser extensionContext with extension loaded — worker-scoped so the browser
  // is launched once per worker instead of once per test.
  extensionContext: [async ({}, use) => {
    const userDataDir = createTempUserDataDir();

    // Verify extension path exists
    if (!fs.existsSync(EXTENSION_PATH)) {
      throw new Error(`Extension not found at ${EXTENSION_PATH}. Run 'npm run build' first.`);
    }

    // Use custom Chrome path if available, otherwise use Playwright's bundled Chromium
    const customChromePath = path.join(os.homedir(), '.cache/ms-playwright/chromium-custom/chrome-linux64/chrome');
    const executablePath = fs.existsSync(customChromePath) ? customChromePath : undefined;

    const extensionContext = await chromium.launchPersistentContext(userDataDir, {
      headless: false, // Extensions require headed mode
      executablePath,
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
        '--lang=en-US',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-popup-blocking',
      ],
    });

    // Wait for service worker to register before yielding the extensionContext
    const swDeadline = Date.now() + 10000;
    while (!extensionContext.serviceWorkers()[0] && Date.now() < swDeadline) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    if (!extensionContext.serviceWorkers()[0]) {
      throw new Error('Service worker did not start within timeout');
    }

    await use(extensionContext);

    await extensionContext.close();

    // Clean up temp directory
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  }, { scope: 'worker' }],

  // Get extension ID from service worker — worker-scoped, resolved once per worker.
  extensionId: [async ({ extensionContext }, use) => {
    const serviceWorker = extensionContext.serviceWorkers()[0];
    if (!serviceWorker) {
      throw new Error('Service worker not available (should have been awaited in extensionContext fixture)');
    }
    const extensionId = new URL(serviceWorker.url()).hostname;
    await use(extensionId);
  }, { scope: 'worker' }],

  // Popup page fixture
  popupPage: async ({ extensionContext, extensionId }, use) => {
    const page = await extensionContext.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('domcontentloaded');
    await use(page);
    await page.close();
  },

  // Options page fixture
  optionsPage: async ({ extensionContext, extensionId }, use) => {
    const page = await extensionContext.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await page.waitForLoadState('domcontentloaded');
    await use(page);
    await page.close();
  },

  // Helper functions for test operations
  helpers: async ({ extensionContext, extensionId }, use) => {
    /**
     * Returns the extension service worker, retrying up to 5 s if it has been
     * terminated by the browser (idle termination between tests).
     */
    const getServiceWorker = async (): Promise<Page> => {
      const deadline = Date.now() + 5000;
      while (Date.now() < deadline) {
        const sw = extensionContext.serviceWorkers()[0];
        if (sw) return sw;
        await new Promise(r => setTimeout(r, 200));
      }
      throw new Error('Service worker not available after 5 s (idle termination?)');
    };

    const helpers: ExtensionHelpers = {
      // Set global grouping enabled/disabled
      setGlobalGroupingEnabled: async (enabled: boolean) => {
        const sw = await getServiceWorker();
        await sw.evaluate(async (enabled) => {
          await chrome.storage.sync.set({ globalGroupingEnabled: enabled });
        }, enabled);
      },

      // Set global deduplication enabled/disabled
      setGlobalDeduplicationEnabled: async (enabled: boolean) => {
        const sw = await getServiceWorker();
        await sw.evaluate(async (enabled) => {
          await chrome.storage.sync.set({ globalDeduplicationEnabled: enabled });
        }, enabled);
      },

      // Add a domain rule
      addDomainRule: async (rule: DomainRuleConfig) => {
        const sw = await getServiceWorker();
        await sw.evaluate(async (ruleConfig) => {
          const browser = chrome;
          const result = await browser.storage.sync.get({ domainRules: [] });
          const rules = result.domainRules || [];

          const newRule = {
            id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            label: ruleConfig.label,
            domainFilter: ruleConfig.domainFilter,
            enabled: ruleConfig.enabled !== false,
            groupingEnabled: ruleConfig.groupingEnabled !== false,
            deduplicationEnabled: ruleConfig.deduplicationEnabled !== false,
            deduplicationMatchMode: ruleConfig.deduplicationMatchMode || 'exact',
            color: ruleConfig.color || '',
            groupNameSource: ruleConfig.groupNameSource || 'label',
            titleParsingRegEx: ruleConfig.titleParsingRegEx || '',
            urlParsingRegEx: ruleConfig.urlParsingRegEx || '',
            presetId: ruleConfig.presetId || '',
            badge: '',
          };

          rules.push(newRule);
          await browser.storage.sync.set({ domainRules: rules });
        }, rule);
        // Wait for storage to propagate
        await new Promise(resolve => setTimeout(resolve, 100));
      },

      // Clear all domain rules
      clearDomainRules: async () => {
        const sw = await getServiceWorker();
        await sw.evaluate(async () => {
          await chrome.storage.sync.set({ domainRules: [] });
        });
        await new Promise(resolve => setTimeout(resolve, 100));
      },

      // Get current settings
      getSettings: async () => {
        const sw = await getServiceWorker();
        return await sw.evaluate(async () => {
          return await chrome.storage.sync.get({
            globalGroupingEnabled: true,
            globalDeduplicationEnabled: true,
            domainRules: [],
            notifyOnGrouping: true,
            notifyOnDeduplication: true,
          });
        });
      },

      // Create a new tab - handles navigation errors gracefully
      createTab: async (url: string) => {
        const page = await extensionContext.newPage();
        try {
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
        } catch (e) {
          // Navigation might fail for some test URLs, but the tab is still created
          // which is what we need for testing the extension
        }
        return page;
      },

      // Create a tab that triggers the FULL natural event-handler chain.
      // Simulates what the content script does on auxclick/contextmenu:
      // 1. Injects (url → openerTabId) into globalThis.middleClickedTabs
      // 2. Creates tab with openerTabId → triggers onTabCreated
      // 3. findMiddleClickOpener finds the entry → handleGroupingWithRetry
      // 4. onUpdated(complete) → processGroupingForNewTab → group created
      //
      // Important: The middleClickedTabs.set() and chrome.tabs.create() are combined
      // into a single sw.evaluate() call to guarantee they run in the same SW extensionContext/instance.
      createTabNaturally: async (openerPage: Page, url: string) => {
        const sw = await getServiceWorker();
        const openerUrl = openerPage.url();

        // Start listening for the new page before creating it so Playwright
        // attaches to it (and enables route interception) before navigation starts.
        const newPagePromise = extensionContext.waitForEvent('page', { timeout: 10000 });

        // Single sw.evaluate: find opener, inject middleClickedTabs, create tab.
        // All three steps in one extensionContext call to prevent any SW restart between them.
        const result = await sw.evaluate(async ({ targetUrl, openerUrl }: { targetUrl: string; openerUrl: string }) => {
          const tabs = await chrome.tabs.query({});
          const opener = tabs.find((t: any) => t.url === openerUrl || t.pendingUrl === openerUrl);
          if (!opener) return { openerFound: false, tabCreated: false };
          (globalThis as any).middleClickedTabs.set(targetUrl, opener.id);
          console.log(`[TEST] middleClickedTabs injected: "${targetUrl}" → tab ${opener.id}`);
          await chrome.tabs.create({ url: targetUrl, openerTabId: opener.id, active: true });
          return { openerFound: true, tabCreated: true, openerId: opener.id };
        }, { targetUrl: url, openerUrl });

        if (!result.openerFound) {
          throw new Error(`createTabNaturally: cannot find opener tab for URL: ${openerUrl}`);
        }

        // Wait for Playwright to attach to the new tab (enables route interception before nav).
        const newPage = await newPagePromise.catch(() => null);
        if (newPage) {
          await newPage.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => {});
        }

        // Give the natural event chain time to complete:
        // onTabCreated → findMiddleClickOpener → handleGroupingWithRetry → onUpdated(complete) → processGroupingForNewTab
        await new Promise(r => setTimeout(r, 2000));

        return newPage ?? extensionContext.pages()[extensionContext.pages().length - 1];
      },

      // Create a tab that appears to be opened from another tab
      // Directly invokes the grouping logic for reliable testing
      createTabFromOpener: async (openerPage: Page, url: string) => {
        const sw = await getServiceWorker();

        // Wait for opener page to have a URL
        await new Promise(resolve => setTimeout(resolve, 200));

        const openerUrl = openerPage.url();

        // Get the opener tab info using exact URL matching to avoid selecting the wrong tab
        // when multiple tabs from the same domain exist
        const openerTabInfo = await sw.evaluate(async (exactUrl: string) => {
          const tabs = await chrome.tabs.query({});
          const openerTab = tabs.find((t: any) => t.url === exactUrl || t.pendingUrl === exactUrl);
          return openerTab ? { id: openerTab.id, url: openerTab.url, title: openerTab.title, groupId: openerTab.groupId } : null;
        }, openerUrl);

        if (!openerTabInfo) {
          console.error(`[TEST] Could not find opener tab for URL: ${openerUrl}`);
          // Fallback to window.open if we can't find the tab
          const [newPage] = await Promise.all([
            extensionContext.waitForEvent('page'),
            openerPage.evaluate((url) => {
              window.open(url, '_blank');
            }, url),
          ]);
          try {
            await newPage.waitForLoadState('domcontentloaded', { timeout: 10000 });
          } catch (e) {
            // Ignore timeout
          }
          return newPage;
        }

        // Create the new tab via Chrome API
        const newTabInfo = await sw.evaluate(async ({ url, openerTabId }) => {
          const newTab = await chrome.tabs.create({
            url: url,
            openerTabId: openerTabId,
            active: true,
          });
          return { id: newTab.id, url: newTab.url || url };
        }, { url, openerTabId: openerTabInfo.id });

        // Wait for the tab to initialize
        await new Promise(resolve => setTimeout(resolve, 500));

        // Directly call the grouping function with a fresh opener tab query so that
        // any title/state changes (e.g. document.title set by tests) are reflected.
        await sw.evaluate(async ({ openerTabId, newTabId }) => {
          const processGroupingForNewTab = (globalThis as any).processGroupingForNewTab;

          if (processGroupingForNewTab) {
            const openerTab = await chrome.tabs.get(openerTabId);
            const newTab = await chrome.tabs.get(newTabId);
            console.log(`[TEST] Calling processGroupingForNewTab for opener ${openerTab.id} (${openerTab.url}) and new tab ${newTabId}`);
            await processGroupingForNewTab(openerTab, newTab);
          } else {
            console.error('[TEST] processGroupingForNewTab not available on globalThis');
          }
        }, { openerTabId: openerTabInfo.id, newTabId: newTabInfo.id });

        // Wait for grouping to complete
        await new Promise(resolve => setTimeout(resolve, 500));

        // Find and return the new page
        const pages = extensionContext.pages();
        const newPage = pages.find(p => {
          try {
            const pageUrl = p.url();
            return pageUrl.includes(url.split('/')[2] || url); // Match by domain
          } catch {
            return false;
          }
        });

        return newPage || pages[pages.length - 1];
      },

      // Ungroup all existing tab groups (prevents leakage between tests)
      clearAllTabGroups: async () => {
        const sw = await getServiceWorker();
        await sw.evaluate(async () => {
          if (!(chrome as any).tabGroups) return;
          const groups = await (chrome as any).tabGroups.query({});
          for (const g of groups) {
            const tabs = await chrome.tabs.query({ groupId: g.id });
            if (tabs.length > 0) {
              await chrome.tabs.ungroup(tabs.map((t: any) => t.id).filter(Boolean));
            }
          }
        });
        await new Promise(r => setTimeout(r, 200));
      },

      // Close all non-extension tabs (useful for cleanup between grouped tests)
      closeAllTestTabs: async () => {
        const sw = await getServiceWorker();
        await sw.evaluate(async () => {
          const tabs = await chrome.tabs.query({});
          const testTabs = tabs.filter(t =>
            t.url &&
            !t.url.startsWith('chrome-extension://') &&
            !t.url.startsWith('chrome://') &&
            !t.url.startsWith('about:')
          );
          if (testTabs.length > 0) {
            await chrome.tabs.remove(testTabs.map(t => t.id!).filter(Boolean));
          }
        });
        await new Promise(r => setTimeout(r, 300));
      },

      // Get current tab count
      getTabCount: async () => {
        const sw = await getServiceWorker();
        return await sw.evaluate(async () => {
          const tabs = await chrome.tabs.query({});
          return tabs.length;
        });
      },

      // Get info about tab groups
      getTabGroups: async () => {
        const sw = await getServiceWorker();
        return await sw.evaluate(async () => {
          const browser = chrome;

          // Check if tabGroups API is available (Chrome only)
          if (!browser.tabGroups) {
            return [];
          }

          const groups = await browser.tabGroups.query({});
          const result: TabGroupInfo[] = [];

          for (const group of groups) {
            const tabs = await browser.tabs.query({ groupId: group.id });
            result.push({
              id: group.id,
              title: group.title || '',
              color: group.color || '',
              tabCount: tabs.length,
              tabIds: tabs.map((t: any) => t.id),
            });
          }

          return result;
        });
      },

      /**
       * Waits for deduplication to complete by polling tab count until it
       * stabilises for 300 ms. Much faster than a fixed sleep for the common
       * case where deduplication fires in < 500 ms.
       */
      waitForDeduplication: async (timeoutMs = 2000) => {
        const pollInterval = 100;
        const stableThreshold = 300; // ms of stable count = operation done
        let lastCount = -1;
        let stableMs = 0;
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
          const count = await helpers.getTabCount();
          if (count === lastCount) {
            stableMs += pollInterval;
            if (stableMs >= stableThreshold) return;
          } else {
            lastCount = count;
            stableMs = 0;
          }
          await new Promise(r => setTimeout(r, pollInterval));
        }
      },

      /**
       * Waits for grouping to complete by polling tab-group count until it
       * stabilises for 300 ms. Much faster than a fixed sleep for the common
       * case where grouping fires in < 500 ms.
       */
      waitForGrouping: async (timeoutMs = 2000) => {
        const pollInterval = 100;
        const stableThreshold = 300; // ms of stable group count = operation done
        let lastCount = -1;
        let stableMs = 0;
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
          const groups = await helpers.getTabGroups();
          const count = groups.length;
          if (count === lastCount) {
            stableMs += pollInterval;
            if (stableMs >= stableThreshold) return;
          } else {
            lastCount = count;
            stableMs = 0;
          }
          await new Promise(r => setTimeout(r, pollInterval));
        }
      },

      // Poll until at least one group exists (or the expected title appears).
      // Prefer this over waitForGrouping when you need to assert on the group state.
      waitForTabGrouped: async (expectedTitle?: string, timeoutMs = 8000) => {
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
          const groups = await helpers.getTabGroups();
          if (groups.length > 0) {
            if (!expectedTitle || groups.some(g => g.title === expectedTitle)) {
              return groups;
            }
          }
          await new Promise(r => setTimeout(r, 300));
        }
        return helpers.getTabGroups(); // Return whatever exists at timeout (let caller assert)
      },

      // Get statistics
      getStatistics: async () => {
        const sw = await getServiceWorker();
        return await sw.evaluate(async () => {
          const result = await chrome.storage.local.get({
            statistics: { tabGroupsCreatedCount: 0, tabsDeduplicatedCount: 0 }
          });
          return result.statistics;
        });
      },

      // Reset statistics
      resetStatistics: async () => {
        const sw = await getServiceWorker();
        await sw.evaluate(async () => {
          await chrome.storage.local.set({
            statistics: { tabGroupsCreatedCount: 0, tabsDeduplicatedCount: 0 }
          });
        });
      },
    };

    await use(helpers);
  },
});

export const expect = test.expect;
