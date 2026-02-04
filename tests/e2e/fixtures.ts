import { test as base, chromium, type BrowserContext, type Page } from '@playwright/test';
import * as path from 'path';

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

export const test = base.extend<ExtensionFixtures & { helpers: ExtensionHelpers }>({
  // Custom browser context with extension loaded
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      headless: false, // Extensions require headed mode in some Chromium versions
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
        '--no-first-run',
        '--no-default-browser-check',
      ],
    });

    await use(context);
    await context.close();
  },

  // Get extension ID from service worker
  extensionId: async ({ context }, use) => {
    // Wait for service worker to be ready
    let serviceWorker = context.serviceWorkers()[0];
    if (!serviceWorker) {
      serviceWorker = await context.waitForEvent('serviceworker', { timeout: 30000 });
    }

    const extensionId = new URL(serviceWorker.url()).hostname;
    await use(extensionId);
  },

  // Popup page fixture
  popupPage: async ({ context, extensionId }, use) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await use(page);
    await page.close();
  },

  // Options page fixture
  optionsPage: async ({ context, extensionId }, use) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);
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
          await (globalThis as any).browser.storage.sync.set({ globalGroupingEnabled: enabled });
        }, enabled);
      },

      // Set global deduplication enabled/disabled
      setGlobalDeduplicationEnabled: async (enabled: boolean) => {
        const sw = getServiceWorker();
        await sw.evaluate(async (enabled) => {
          await (globalThis as any).browser.storage.sync.set({ globalDeduplicationEnabled: enabled });
        }, enabled);
      },

      // Add a domain rule
      addDomainRule: async (rule: DomainRuleConfig) => {
        const sw = getServiceWorker();
        await sw.evaluate(async (ruleConfig) => {
          const browser = (globalThis as any).browser;
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
      },

      // Clear all domain rules
      clearDomainRules: async () => {
        const sw = getServiceWorker();
        await sw.evaluate(async () => {
          await (globalThis as any).browser.storage.sync.set({ domainRules: [] });
        });
      },

      // Get current settings
      getSettings: async () => {
        const sw = getServiceWorker();
        return await sw.evaluate(async () => {
          return await (globalThis as any).browser.storage.sync.get({
            globalGroupingEnabled: true,
            globalDeduplicationEnabled: true,
            domainRules: [],
            notifyOnGrouping: true,
            notifyOnDeduplication: true,
          });
        });
      },

      // Create a new tab
      createTab: async (url: string) => {
        const page = await context.newPage();
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        return page;
      },

      // Create a tab that appears to be opened from another tab (simulated)
      createTabFromOpener: async (openerPage: Page, url: string) => {
        // Use window.open to create a tab with opener relationship
        const [newPage] = await Promise.all([
          context.waitForEvent('page'),
          openerPage.evaluate((url) => {
            window.open(url, '_blank');
          }, url),
        ]);

        await newPage.waitForLoadState('domcontentloaded');
        return newPage;
      },

      // Get current tab count
      getTabCount: async () => {
        const sw = getServiceWorker();
        return await sw.evaluate(async () => {
          const tabs = await (globalThis as any).browser.tabs.query({});
          return tabs.length;
        });
      },

      // Get info about tab groups
      getTabGroups: async () => {
        const sw = getServiceWorker();
        return await sw.evaluate(async () => {
          const browser = (globalThis as any).browser;

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
          const result = await (globalThis as any).browser.storage.local.get({
            statistics: { tabGroupsCreatedCount: 0, tabsDeduplicatedCount: 0 }
          });
          return result.statistics;
        });
      },

      // Reset statistics
      resetStatistics: async () => {
        const sw = getServiceWorker();
        await sw.evaluate(async () => {
          await (globalThis as any).browser.storage.local.set({
            statistics: { tabGroupsCreatedCount: 0, tabsDeduplicatedCount: 0 }
          });
        });
      },
    };

    await use(helpers);
  },
});

export const expect = test.expect;
