import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isDeduplicationEnabled,
  getMatchMode,
  shouldProcessTab,
  markTabAsProcessed,
  clearProcessedTabsCache,
  isUrlMatch,
  findDuplicateTab,
  decideDedupDirection,
} from '../src/background/deduplication';
import type { DomainRuleSetting } from '../src/types/syncSettings';
import type { Browser } from 'wxt/browser';

// Mock the wxt/browser module - must run before imports.
vi.mock('wxt/browser', () => {
  const mockTabsQuery = vi.fn();
  return {
    browser: {
      tabs: {
        query: mockTabsQuery,
        update: vi.fn(),
        reload: vi.fn(),
        remove: vi.fn(),
        TAB_ID_NONE: -1
      },
      windows: {
        get: vi.fn(),
        update: vi.fn()
      }
    }
  };
});

// Mock dependencies.
vi.mock('../src/utils/statisticsUtils.js', () => ({
  incrementStat: vi.fn(),
  stampRuleLastUsed: vi.fn()
}));

vi.mock('../src/background/settings.js', () => ({
  getSettings: vi.fn()
}));

vi.mock('../src/utils/notifications.js', () => ({
  showNotification: vi.fn()
}));

vi.mock('../src/utils/i18n.js', () => ({
  getMessage: vi.fn((key) => key)
}));

vi.mock('../src/utils/deduplicationSkip.js', () => ({
  shouldSkipDeduplication: vi.fn(() => false)
}));

import { browser } from 'wxt/browser';

describe('deduplication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearProcessedTabsCache();
  });

  describe('isDeduplicationEnabled', () => {
    it('returns global && deduplicateUnmatched when no rule applies', () => {
      expect(isDeduplicationEnabled(undefined, true, true)).toBe(true);
      expect(isDeduplicationEnabled(undefined, false, true)).toBe(false);
      expect(isDeduplicationEnabled(undefined, true, false)).toBe(false);
      expect(isDeduplicationEnabled(undefined, false, false)).toBe(false);
    });

    it("returns the rule's value when present, independently of the unmatched flag", () => {
      const ruleEnabled: DomainRuleSetting = {
        id: '1',
        enabled: true,
        domainFilter: 'example.com',
        label: 'Test',
        titleParsingRegEx: '',
        urlParsingRegEx: '',
        groupNameSource: 'title',
        deduplicationMatchMode: 'exact',
        groupId: null,
        collapseNew: false,
        collapseExisting: false,
        deduplicationEnabled: true
      };

      const ruleDisabled: DomainRuleSetting = {
        ...ruleEnabled,
        deduplicationEnabled: false
      };

      expect(isDeduplicationEnabled(ruleEnabled, false, false)).toBe(true);
      expect(isDeduplicationEnabled(ruleDisabled, true, true)).toBe(false);
    });
  });

  describe('getMatchMode', () => {
    it('returns exact by default when no rule applies', () => {
      expect(getMatchMode(undefined)).toBe('exact');
    });

    it("returns the rule's mode", () => {
      const ruleExact: DomainRuleSetting = {
        id: '1',
        enabled: true,
        domainFilter: 'example.com',
        label: 'Test',
        titleParsingRegEx: '',
        urlParsingRegEx: '',
        groupNameSource: 'title',
        deduplicationMatchMode: 'exact',
        groupId: null,
        collapseNew: false,
        collapseExisting: false,
        deduplicationEnabled: true
      };

      const ruleIncludes: DomainRuleSetting = {
        ...ruleExact,
        deduplicationMatchMode: 'includes'
      };

      expect(getMatchMode(ruleExact)).toBe('exact');
      expect(getMatchMode(ruleIncludes)).toBe('includes');
    });
  });

  describe('shouldProcessTab', () => {
    it('returns false for an empty URL', () => {
      expect(shouldProcessTab('', 1)).toBe(false);
    });

    it('returns false for about: URLs', () => {
      expect(shouldProcessTab('about:blank', 1)).toBe(false);
      expect(shouldProcessTab('about:newtab', 1)).toBe(false);
    });

    it('returns false for chrome: URLs', () => {
      expect(shouldProcessTab('chrome://extensions', 1)).toBe(false);
      expect(shouldProcessTab('chrome://settings', 1)).toBe(false);
    });

    it('returns true for a regular web URL', () => {
      expect(shouldProcessTab('https://example.com', 1)).toBe(true);
    });

    it('returns false for an already-processed tab', () => {
      expect(shouldProcessTab('https://example.com', 1)).toBe(true);
      markTabAsProcessed(1, 'https://example.com');
      expect(shouldProcessTab('https://example.com', 1)).toBe(false);
    });
  });

  describe('markTabAsProcessed / clearProcessedTabsCache', () => {
    it('marks a tab as processed', () => {
      expect(shouldProcessTab('https://example.com', 1)).toBe(true);
      markTabAsProcessed(1, 'https://example.com');
      expect(shouldProcessTab('https://example.com', 1)).toBe(false);
    });

    it('allows the same tab with a different URL', () => {
      markTabAsProcessed(1, 'https://example.com/page1');
      expect(shouldProcessTab('https://example.com/page2', 1)).toBe(true);
    });

    it('clears the cache', () => {
      markTabAsProcessed(1, 'https://example.com');
      clearProcessedTabsCache();
      expect(shouldProcessTab('https://example.com', 1)).toBe(true);
    });
  });

  describe('isUrlMatch', () => {
    describe('exact mode', () => {
      it('matches identical URLs', () => {
        expect(isUrlMatch('https://example.com/page', 'https://example.com/page', 'exact')).toBe(true);
      });

      it('does not match different URLs', () => {
        expect(isUrlMatch('https://example.com/page1', 'https://example.com/page2', 'exact')).toBe(false);
      });

      it('is sensitive to query params', () => {
        expect(isUrlMatch('https://example.com/page', 'https://example.com/page?foo=bar', 'exact')).toBe(false);
      });
    });

    describe('includes mode', () => {
      it('matches when the new URL contains the old one', () => {
        expect(isUrlMatch('https://example.com', 'https://example.com/page', 'includes')).toBe(true);
      });

      it('matches when the old URL contains the new one', () => {
        expect(isUrlMatch('https://example.com/page', 'https://example.com', 'includes')).toBe(true);
      });

      it('does not match URLs without containment', () => {
        expect(isUrlMatch('https://foo.com', 'https://bar.com', 'includes')).toBe(false);
      });
    });

    describe('exact_ignore_params mode', () => {
      it('matches when only an ignored param differs', () => {
        expect(
          isUrlMatch(
            'https://example.com/page?utm_source=a&ref=x',
            'https://example.com/page?utm_source=b&ref=x',
            'exact_ignore_params',
            ['utm_source'],
          ),
        ).toBe(true);
      });

      it('matches with a simple wildcard', () => {
        expect(
          isUrlMatch(
            'https://example.com/page?utm_source=a&utm_medium=x&keep=1',
            'https://example.com/page?utm_source=b&utm_campaign=y&keep=1',
            'exact_ignore_params',
            ['utm_*'],
          ),
        ).toBe(true);
      });

      it('does not match when a non-ignored param differs', () => {
        expect(
          isUrlMatch(
            'https://example.com/page?utm_source=a&ref=x',
            'https://example.com/page?utm_source=b&ref=y',
            'exact_ignore_params',
            ['utm_source'],
          ),
        ).toBe(false);
      });

      it('does not match when the path differs', () => {
        expect(
          isUrlMatch(
            'https://example.com/a?utm_source=a',
            'https://example.com/b?utm_source=a',
            'exact_ignore_params',
            ['utm_source'],
          ),
        ).toBe(false);
      });

      it('behaves like exact when no ignored params are provided', () => {
        expect(
          isUrlMatch(
            'https://example.com/page?a=1',
            'https://example.com/page?a=1',
            'exact_ignore_params',
            [],
          ),
        ).toBe(true);
        expect(
          isUrlMatch(
            'https://example.com/page?a=1',
            'https://example.com/page?a=2',
            'exact_ignore_params',
            [],
          ),
        ).toBe(false);
      });
    });

    describe('unknown mode', () => {
      it('returns false for an unknown mode', () => {
        expect(isUrlMatch('https://example.com', 'https://example.com', 'unknown')).toBe(false);
      });
    });
  });

  describe('findDuplicateTab', () => {
    it('finds a duplicate tab with exact mode', async () => {
      // Configure the simulated tabs.
      vi.mocked(browser.tabs.query).mockResolvedValue([
        { id: 1, url: 'https://example.com/page', windowId: 1 },
        { id: 2, url: 'https://other.com', windowId: 1 }
      ] as any);

      const duplicate = await findDuplicateTab(3, 'https://example.com/page', 'exact', 1);

      expect(duplicate).toBeDefined();
      expect(duplicate?.id).toBe(1);
    });

    it('does not find a duplicate when the ID matches the current tab', async () => {
      vi.mocked(browser.tabs.query).mockResolvedValue([
        { id: 1, url: 'https://example.com/page', windowId: 1 }
      ] as any);

      const duplicate = await findDuplicateTab(1, 'https://example.com/page', 'exact', 1);

      expect(duplicate).toBeUndefined();
    });

    it('does not find a duplicate when no URL matches', async () => {
      vi.mocked(browser.tabs.query).mockResolvedValue([
        { id: 1, url: 'https://other.com', windowId: 1 }
      ] as any);

      const duplicate = await findDuplicateTab(2, 'https://example.com/page', 'exact', 1);

      expect(duplicate).toBeUndefined();
    });

    it('finds a duplicate with includes mode', async () => {
      vi.mocked(browser.tabs.query).mockResolvedValue([
        { id: 1, url: 'https://example.com/page/subpage', windowId: 1 }
      ] as any);

      const duplicate = await findDuplicateTab(2, 'https://example.com/page', 'includes', 1);

      expect(duplicate).toBeDefined();
      expect(duplicate?.id).toBe(1);
    });

    it('finds a duplicate in exact_ignore_params mode (wildcard)', async () => {
      vi.mocked(browser.tabs.query).mockResolvedValue([
        { id: 1, url: 'https://example.com/page?utm_source=newsletter&ref=home', windowId: 1 }
      ] as any);

      const duplicate = await findDuplicateTab(
        2,
        'https://example.com/page?utm_source=twitter&ref=home',
        'exact_ignore_params',
        1,
        ['utm_*'],
      );

      expect(duplicate).toBeDefined();
      expect(duplicate?.id).toBe(1);
    });

    it('does not find a duplicate when a non-ignored param differs', async () => {
      vi.mocked(browser.tabs.query).mockResolvedValue([
        { id: 1, url: 'https://example.com/page?utm_source=a&ref=home', windowId: 1 }
      ] as any);

      const duplicate = await findDuplicateTab(
        2,
        'https://example.com/page?utm_source=b&ref=other',
        'exact_ignore_params',
        1,
        ['utm_*'],
      );

      expect(duplicate).toBeUndefined();
    });
  });

  describe('decideDedupDirection', () => {
    const makeTab = (id: number, groupId: number): Browser.tabs.Tab =>
      ({ id, groupId } as unknown as Browser.tabs.Tab);

    const oldUngrouped = makeTab(1, -1);
    const oldGrouped = makeTab(1, 42);
    const newUngrouped = makeTab(2, -1);
    const newGrouped = makeTab(2, 99);

    describe('keep-old', () => {
      it('keeps the old tab when neither is grouped', () => {
        const { tabToKeep, tabToClose } = decideDedupDirection(oldUngrouped, newUngrouped, 'keep-old');
        expect(tabToKeep.id).toBe(1);
        expect(tabToClose.id).toBe(2);
      });

      it('keeps the old tab when the old tab is grouped', () => {
        const { tabToKeep } = decideDedupDirection(oldGrouped, newUngrouped, 'keep-old');
        expect(tabToKeep.id).toBe(1);
      });

      it('keeps the old tab even when the new tab is grouped', () => {
        const { tabToKeep } = decideDedupDirection(oldUngrouped, newGrouped, 'keep-old');
        expect(tabToKeep.id).toBe(1);
      });
    });

    describe('keep-new', () => {
      it('keeps the new tab when neither is grouped', () => {
        const { tabToKeep, tabToClose } = decideDedupDirection(oldUngrouped, newUngrouped, 'keep-new');
        expect(tabToKeep.id).toBe(2);
        expect(tabToClose.id).toBe(1);
      });

      it('keeps the new tab even when the old tab is grouped', () => {
        const { tabToKeep } = decideDedupDirection(oldGrouped, newUngrouped, 'keep-new');
        expect(tabToKeep.id).toBe(2);
      });

      it('keeps the new tab when the new tab is grouped', () => {
        const { tabToKeep } = decideDedupDirection(oldUngrouped, newGrouped, 'keep-new');
        expect(tabToKeep.id).toBe(2);
      });
    });

    describe('keep-grouped', () => {
      it('keeps whichever tab is grouped (old grouped)', () => {
        const { tabToKeep, tabToClose } = decideDedupDirection(oldGrouped, newUngrouped, 'keep-grouped');
        expect(tabToKeep.id).toBe(1);
        expect(tabToClose.id).toBe(2);
      });

      it('keeps whichever tab is grouped (new grouped)', () => {
        const { tabToKeep, tabToClose } = decideDedupDirection(oldUngrouped, newGrouped, 'keep-grouped');
        expect(tabToKeep.id).toBe(2);
        expect(tabToClose.id).toBe(1);
      });

      it('falls back to keep-old when neither is grouped', () => {
        const { tabToKeep } = decideDedupDirection(oldUngrouped, newUngrouped, 'keep-grouped');
        expect(tabToKeep.id).toBe(1);
      });

      it('falls back to keep-old when both are grouped', () => {
        const { tabToKeep } = decideDedupDirection(oldGrouped, newGrouped, 'keep-grouped');
        expect(tabToKeep.id).toBe(1);
      });
    });

    describe('keep-grouped-or-new', () => {
      it('keeps whichever tab is grouped (old grouped)', () => {
        const { tabToKeep, tabToClose } = decideDedupDirection(oldGrouped, newUngrouped, 'keep-grouped-or-new');
        expect(tabToKeep.id).toBe(1);
        expect(tabToClose.id).toBe(2);
      });

      it('keeps whichever tab is grouped (new grouped)', () => {
        const { tabToKeep, tabToClose } = decideDedupDirection(oldUngrouped, newGrouped, 'keep-grouped-or-new');
        expect(tabToKeep.id).toBe(2);
        expect(tabToClose.id).toBe(1);
      });

      it('falls back to keep-new when neither is grouped', () => {
        const { tabToKeep } = decideDedupDirection(oldUngrouped, newUngrouped, 'keep-grouped-or-new');
        expect(tabToKeep.id).toBe(2);
      });

      it('falls back to keep-new when both are grouped', () => {
        const { tabToKeep } = decideDedupDirection(oldGrouped, newGrouped, 'keep-grouped-or-new');
        expect(tabToKeep.id).toBe(2);
      });
    });
  });
});
