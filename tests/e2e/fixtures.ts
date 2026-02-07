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
  context: BrowserContext;
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
  getTabCount: () => Promise<number>;
  getTabGroups: () => Promise<TabGroupInfo[]>;

  // Utilities
  waitForDeduplication: (timeoutMs?: number) => Promise<void>;
  waitForGrouping: (timeoutMs?: number) => Promise<void>;
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
  // Custom browser context with extension loaded
  context: async ({}, use) => {
    const userDataDir = createTempUserDataDir();

    // Verify extension path exists
    if (!fs.existsSync(EXTENSION_PATH)) {
      throw new Error(`Extension not found at ${EXTENSION_PATH}. Run 'npm run build' first.`);
    }

    // Use custom Chrome path if available, otherwise use Playwright's bundled Chromium
    const customChromePath = path.join(os.homedir(), '.cache/ms-playwright/chromium-custom/chrome-linux64/chrome');
    const executablePath = fs.existsSync(customChromePath) ? customChromePath : undefined;

    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: false, // Extensions require headed mode
      executablePath,
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-popup-blocking',
      ],
    });

    // Wait a bit for extension to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));

    await use(context);

    await context.close();

    // Clean up temp directory
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  },

  // Get extension ID from service worker
  extensionId: async ({ context }, use) => {
    // Wait for service worker to be ready
    let serviceWorker = context.serviceWorkers()[0];

    if (!serviceWorker) {
      // Wait up to 10 seconds for service worker
      const maxWait = 10000;
      const startTime = Date.now();

      while (!serviceWorker && Date.now() - startTime < maxWait) {
        await new Promise(resolve => setTimeout(resolve, 500));
        serviceWorker = context.serviceWorkers()[0];
      }

      if (!serviceWorker) {
        throw new Error('Service worker did not start within timeout');
      }
    }

    const extensionId = new URL(serviceWorker.url()).hostname;
    await use(extensionId);
  },

  // Popup page fixture
  popupPage: async ({ context, extensionId }, use) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('domcontentloaded');
    await use(page);
    await page.close();
  },

  // Options page fixture
  optionsPage: async ({ context, extensionId }, use) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await page.waitForLoadState('domcontentloaded');
    await use(page);
    await page.close();
  },

  // Helper functions for test operations
  helpers: async ({ context, extensionId }, use) => {
    const getServiceWorker = () => {
      const sw = context.serviceWorkers()[0];
      if (!sw) throw new Error('Service worker not found');
      return sw;
    };

    const helpers: ExtensionHelpers = {
      // Set global grouping enabled/disabled
      setGlobalGroupingEnabled: async (enabled: boolean) => {
        const sw = getServiceWorker();
        await sw.evaluate(async (enabled) => {
          await chrome.storage.sync.set({ globalGroupingEnabled: enabled });
        }, enabled);
      },

      // Set global deduplication enabled/disabled
      setGlobalDeduplicationEnabled: async (enabled: boolean) => {
        const sw = getServiceWorker();
        await sw.evaluate(async (enabled) => {
          await chrome.storage.sync.set({ globalDeduplicationEnabled: enabled });
        }, enabled);
      },

      // Add a domain rule
      addDomainRule: async (rule: DomainRuleConfig) => {
        const sw = getServiceWorker();
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
        const sw = getServiceWorker();
        await sw.evaluate(async () => {
          await chrome.storage.sync.set({ domainRules: [] });
        });
        await new Promise(resolve => setTimeout(resolve, 100));
      },

      // Get current settings
      getSettings: async () => {
        const sw = getServiceWorker();
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
        const page = await context.newPage();
        try {
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
        } catch (e) {
          // Navigation might fail for some test URLs, but the tab is still created
          // which is what we need for testing the extension
        }
        return page;
      },

      // Create a tab that appears to be opened from another tab
      // Directly invokes the grouping logic for reliable testing
      createTabFromOpener: async (openerPage: Page, url: string) => {
        const sw = getServiceWorker();

        // Wait for opener page to have a URL
        await new Promise(resolve => setTimeout(resolve, 200));

        // Extract domain from the opener page URL for matching
        let openerDomain = '';
        try {
          const openerUrl = openerPage.url();
          openerDomain = new URL(openerUrl).hostname;
        } catch (e) {
          // Fallback to simple extraction
          openerDomain = openerPage.url().replace('https://', '').replace('http://', '').split('/')[0];
        }

        // Get the opener tab info with more robust matching
        const openerTabInfo = await sw.evaluate(async (domain) => {
          const tabs = await chrome.tabs.query({});
          // Find tab that contains this domain in its URL
          const openerTab = tabs.find((t: any) => t.url && t.url.includes(domain));
          return openerTab ? { id: openerTab.id, url: openerTab.url, title: openerTab.title, groupId: openerTab.groupId } : null;
        }, openerDomain);

        if (!openerTabInfo) {
          console.error(`[TEST] Could not find opener tab for domain: ${openerDomain}`);
          // Fallback to window.open if we can't find the tab
          const [newPage] = await Promise.all([
            context.waitForEvent('page'),
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

        // Directly call the grouping function
        await sw.evaluate(async ({ openerTab, newTabId }) => {
          const processGroupingForNewTab = (globalThis as any).processGroupingForNewTab;

          if (processGroupingForNewTab) {
            const newTab = await chrome.tabs.get(newTabId);
            console.log(`[TEST] Calling processGroupingForNewTab for opener ${openerTab.id} (${openerTab.url}) and new tab ${newTabId}`);
            await processGroupingForNewTab(openerTab, newTab);
          } else {
            console.error('[TEST] processGroupingForNewTab not available on globalThis');
          }
        }, { openerTab: openerTabInfo, newTabId: newTabInfo.id });

        // Wait for grouping to complete
        await new Promise(resolve => setTimeout(resolve, 500));

        // Find and return the new page
        const pages = context.pages();
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

      // Get current tab count
      getTabCount: async () => {
        const sw = getServiceWorker();
        return await sw.evaluate(async () => {
          const tabs = await chrome.tabs.query({});
          return tabs.length;
        });
      },

      // Get info about tab groups
      getTabGroups: async () => {
        const sw = getServiceWorker();
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

      // Wait for deduplication to complete
      waitForDeduplication: async (timeoutMs = 2000) => {
        await new Promise(resolve => setTimeout(resolve, timeoutMs));
      },

      // Wait for grouping to complete
      waitForGrouping: async (timeoutMs = 2000) => {
        await new Promise(resolve => setTimeout(resolve, timeoutMs));
      },

      // Get statistics
      getStatistics: async () => {
        const sw = getServiceWorker();
        return await sw.evaluate(async () => {
          const result = await chrome.storage.local.get({
            statistics: { tabGroupsCreatedCount: 0, tabsDeduplicatedCount: 0 }
          });
          return result.statistics;
        });
      },

      // Reset statistics
      resetStatistics: async () => {
        const sw = getServiceWorker();
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
