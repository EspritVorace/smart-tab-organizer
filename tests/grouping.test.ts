import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  findMatchingRule,
  findMatchingRules,
  findGroupingRuleForTab,
  determineGroupColor,
  extractGroupNameFromRule,
  createGroupingContext
} from '../src/background/grouping';
import type { DomainRuleSetting } from '../src/types/syncSettings';

// Mock to avoid pulling in the browser module.
vi.mock('wxt/browser', () => ({
  browser: {
    tabs: {
      get: vi.fn(),
      group: vi.fn(),
      ungroup: vi.fn(),
      TAB_ID_NONE: -1
    },
    tabGroups: {
      update: vi.fn()
    },
    runtime: {
      getURL: vi.fn()
    },
    notifications: {
      create: vi.fn(),
      clear: vi.fn()
    }
  }
}));

// Mock dependent modules.
vi.mock('../src/utils/statisticsUtils.js', () => ({
  incrementStat: vi.fn()
}));

vi.mock('../src/background/settings.js', () => ({
  getSettings: vi.fn()
}));

vi.mock('../src/background/messaging.js', () => ({
  promptForGroupName: vi.fn()
}));

vi.mock('../src/utils/notifications.js', () => ({
  showNotification: vi.fn()
}));

vi.mock('../src/utils/i18n.js', () => ({
  getMessage: vi.fn((key) => key)
}));

// Type used for mocked tabs.
interface MockTab {
  id: number;
  index: number;
  highlighted: boolean;
  active: boolean;
  pinned: boolean;
  incognito: boolean;
  windowId: number;
  url?: string;
  title?: string;
  groupId?: number;
}

describe('grouping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockRule = (overrides: Partial<DomainRuleSetting> = {}): DomainRuleSetting => ({
    id: '1',
    enabled: true,
    domainFilter: 'example.com',
    label: 'Test Rule',
    titleParsingRegEx: '',
    urlParsingRegEx: '',
    groupNameSource: 'title',
    deduplicationMatchMode: 'exact',
    groupId: null,
    collapseNew: false,
    collapseExisting: false,
    deduplicationEnabled: true,
    ...overrides
  });

  const createMockTab = (overrides: Partial<MockTab> = {}): MockTab => ({
    id: 1,
    index: 0,
    highlighted: false,
    active: true,
    pinned: false,
    incognito: false,
    windowId: 1,
    url: 'https://example.com/page',
    title: 'Test Page - Example',
    ...overrides
  });

  describe('findMatchingRule', () => {
    it('finds a matching rule for a URL', () => {
      const rules: DomainRuleSetting[] = [
        createMockRule({ domainFilter: 'example.com', label: 'Example Rule' }),
        createMockRule({ domainFilter: 'other.com', label: 'Other Rule' })
      ];

      const result = findMatchingRule('https://example.com/page', rules);

      expect(result).toBeDefined();
      expect(result?.label).toBe('Example Rule');
    });

    it('returns undefined when no rule matches', () => {
      const rules: DomainRuleSetting[] = [
        createMockRule({ domainFilter: 'other.com' })
      ];

      const result = findMatchingRule('https://example.com/page', rules);

      expect(result).toBeUndefined();
    });

    it('ignores disabled rules', () => {
      const rules: DomainRuleSetting[] = [
        createMockRule({ domainFilter: 'example.com', enabled: false }),
        createMockRule({ domainFilter: 'example.com', enabled: true, label: 'Active Rule' })
      ];

      const result = findMatchingRule('https://example.com/page', rules);

      expect(result?.label).toBe('Active Rule');
    });

    it('matches subdomains implicitly (plain domain)', () => {
      const rules: DomainRuleSetting[] = [
        createMockRule({ domainFilter: 'example.com' })
      ];

      const result = findMatchingRule('https://sub.example.com/page', rules);

      expect(result).toBeDefined();
    });

    it('returns the first matching rule', () => {
      const rules: DomainRuleSetting[] = [
        createMockRule({ domainFilter: 'example.com', label: 'First' }),
        createMockRule({ domainFilter: 'example.com', label: 'Second' })
      ];

      const result = findMatchingRule('https://example.com/page', rules);

      expect(result?.label).toBe('First');
    });
  });

  describe('findMatchingRules', () => {
    it('returns all enabled rules matching the domain, in order', () => {
      const rules: DomainRuleSetting[] = [
        createMockRule({ domainFilter: 'example.com', label: 'First' }),
        createMockRule({ domainFilter: 'example.com', label: 'Second' }),
        createMockRule({ domainFilter: 'other.com', label: 'Other' }),
      ];

      const result = findMatchingRules('https://example.com/page', rules);

      expect(result.map(r => r.label)).toEqual(['First', 'Second']);
    });

    it('ignores disabled rules', () => {
      const rules: DomainRuleSetting[] = [
        createMockRule({ domainFilter: 'example.com', label: 'Off', enabled: false }),
        createMockRule({ domainFilter: 'example.com', label: 'On' }),
      ];

      const result = findMatchingRules('https://example.com/page', rules);

      expect(result.map(r => r.label)).toEqual(['On']);
    });

    it('returns an empty array when no rule matches', () => {
      const rules: DomainRuleSetting[] = [
        createMockRule({ domainFilter: 'other.com' }),
      ];

      expect(findMatchingRules('https://example.com/page', rules)).toEqual([]);
    });
  });

  describe('findGroupingRuleForTab', () => {
    it('skips the first rule when its extraction fails and uses the next one', () => {
      const rules: DomainRuleSetting[] = [
        createMockRule({
          id: '1',
          domainFilter: 'example.com',
          label: 'First',
          groupingEnabled: true,
          groupNameSource: 'title',
          titleParsingRegEx: 'NoMatch - (\\w+)',
        }),
        createMockRule({
          id: '2',
          domainFilter: 'example.com',
          label: 'Second',
          groupingEnabled: true,
          groupNameSource: 'title',
          titleParsingRegEx: 'Test Page - (\\w+)',
        }),
      ];
      const tab = createMockTab({ title: 'Test Page - Example' });

      const result = findGroupingRuleForTab(tab, rules);

      expect(result?.rule.label).toBe('Second');
      expect(result?.groupName).toBe('Example');
    });

    it('returns null when no rule produces a group name', () => {
      const rules: DomainRuleSetting[] = [
        createMockRule({
          id: '1',
          domainFilter: 'example.com',
          label: 'First',
          groupingEnabled: true,
          groupNameSource: 'title',
          titleParsingRegEx: 'NoMatch - (\\w+)',
        }),
        createMockRule({
          id: '2',
          domainFilter: 'example.com',
          label: 'Second',
          groupingEnabled: true,
          groupNameSource: 'title',
          titleParsingRegEx: 'AlsoNoMatch (\\w+)',
        }),
      ];
      const tab = createMockTab({ title: 'Test Page - Example' });

      expect(findGroupingRuleForTab(tab, rules)).toBeNull();
    });

    it('skips rules whose groupingEnabled is false', () => {
      const rules: DomainRuleSetting[] = [
        createMockRule({
          id: '1',
          domainFilter: 'example.com',
          label: 'GroupingDisabled',
          groupingEnabled: false,
          groupNameSource: 'title',
          titleParsingRegEx: 'Test Page - (\\w+)',
        }),
        createMockRule({
          id: '2',
          domainFilter: 'example.com',
          label: 'Active',
          groupingEnabled: true,
          groupNameSource: 'title',
          titleParsingRegEx: 'Test Page - (\\w+)',
        }),
      ];
      const tab = createMockTab({ title: 'Test Page - Example' });

      const result = findGroupingRuleForTab(tab, rules);

      expect(result?.rule.label).toBe('Active');
    });

    it('returns the first rule that succeeds (order preserved)', () => {
      const rules: DomainRuleSetting[] = [
        createMockRule({
          id: '1',
          domainFilter: 'example.com',
          label: 'First',
          groupingEnabled: true,
          groupNameSource: 'title',
          titleParsingRegEx: 'Test Page - (\\w+)',
        }),
        createMockRule({
          id: '2',
          domainFilter: 'example.com',
          label: 'Second',
          groupingEnabled: true,
          groupNameSource: 'title',
          titleParsingRegEx: 'Test Page - (\\w+)',
        }),
      ];
      const tab = createMockTab({ title: 'Test Page - Example' });

      const result = findGroupingRuleForTab(tab, rules);

      expect(result?.rule.label).toBe('First');
    });

    it('coerces manual and smart_manual to smart_label when requested', () => {
      const rules: DomainRuleSetting[] = [
        createMockRule({
          domainFilter: 'example.com',
          label: 'My Label',
          groupingEnabled: true,
          groupNameSource: 'manual',
        }),
      ];
      const tab = createMockTab({ url: 'https://example.com/page', title: 'No regex match' });

      const result = findGroupingRuleForTab(tab, rules, { coerceManualToLabel: true });

      expect(result?.groupName).toBe('My Label');
    });

    it('returns null when the URL is missing', () => {
      const rules: DomainRuleSetting[] = [
        createMockRule({ domainFilter: 'example.com', groupingEnabled: true }),
      ];
      const tab = createMockTab({ url: undefined });

      expect(findGroupingRuleForTab(tab, rules)).toBeNull();
    });
  });

  describe('determineGroupColor', () => {
    it("returns the rule's color when defined", () => {
      const rule = createMockRule({ color: 'blue' });

      const result = determineGroupColor(rule, {});

      expect(result).toBe('blue');
    });

    it('returns null when the rule has no color', () => {
      const rule = createMockRule({ color: undefined });

      const result = determineGroupColor(rule, {});

      expect(result).toBeNull();
    });

    it('returns null for an empty color', () => {
      const rule = createMockRule({ color: '' });

      const result = determineGroupColor(rule, {});

      // An empty string is falsy, so the helper returns null.
      expect(result).toBeNull();
    });
  });

  describe('extractGroupNameFromRule', () => {
    describe('groupNameSource: title', () => {
      it('extracts the group name from the title via regex', () => {
        const rule = createMockRule({
          groupNameSource: 'title',
          titleParsingRegEx: 'Test Page - (\\w+)'
        });
        const tab = createMockTab({ title: 'Test Page - Example' });

        const result = extractGroupNameFromRule(rule, tab);

        expect(result).toBe('Example');
      });

      it('returns null when neither the title nor the URL matches', () => {
        const rule = createMockRule({
          groupNameSource: 'title',
          titleParsingRegEx: 'NoMatch - (\\w+)',
          label: 'Fallback Label'
        });
        const tab = createMockTab({ title: 'Test Page - Example' });

        const result = extractGroupNameFromRule(rule, tab);

        expect(result).toBeNull();
      });

      it('returns null when there is no label and no extraction', () => {
        const rule = createMockRule({
          groupNameSource: 'title',
          titleParsingRegEx: 'NoMatch',
          label: ''
        });
        const tab = createMockTab({ title: 'Test Page' });

        const result = extractGroupNameFromRule(rule, tab);

        expect(result).toBeNull();
      });

      it('falls back to the URL when the title yields nothing', () => {
        const rule = createMockRule({
          groupNameSource: 'title',
          titleParsingRegEx: 'NoMatch - (\\w+)',
          urlParsingRegEx: 'example\\.com/(\\w+)',
          label: 'Should Not Use Label'
        });
        const tab = createMockTab({
          title: 'Test Page - Example',
          url: 'https://example.com/products/item'
        });

        const result = extractGroupNameFromRule(rule, tab);

        expect(result).toBe('products');
      });
    });

    describe('groupNameSource: url', () => {
      it('extracts the group name from the URL via regex', () => {
        const rule = createMockRule({
          groupNameSource: 'url',
          urlParsingRegEx: 'example\\.com/(\\w+)'
        });
        const tab = createMockTab({ url: 'https://example.com/products/item' });

        const result = extractGroupNameFromRule(rule, tab);

        expect(result).toBe('products');
      });

      it('returns null when neither the URL nor the title matches', () => {
        const rule = createMockRule({
          groupNameSource: 'url',
          urlParsingRegEx: 'nomatch/(\\w+)',
          label: 'URL Fallback'
        });
        const tab = createMockTab({ url: 'https://example.com/page' });

        const result = extractGroupNameFromRule(rule, tab);

        expect(result).toBeNull();
      });

      it('falls back to the title when the URL yields nothing', () => {
        const rule = createMockRule({
          groupNameSource: 'url',
          urlParsingRegEx: 'nomatch/(\\w+)',
          titleParsingRegEx: 'Test Page - (\\w+)',
          label: 'Should Not Use Label'
        });
        const tab = createMockTab({
          url: 'https://example.com/page',
          title: 'Test Page - Example'
        });

        const result = extractGroupNameFromRule(rule, tab);

        expect(result).toBe('Example');
      });
    });

    describe('groupNameSource: smart_label', () => {
      it('falls back to the label when no extraction succeeds', () => {
        const rule = createMockRule({
          groupNameSource: 'smart_label',
          label: 'Smart Label Fallback',
          presetId: 'preset-1'
        });
        const tab = createMockTab({ title: 'No match here' });

        const result = extractGroupNameFromRule(rule, tab);

        expect(result).toBe('Smart Label Fallback');
      });
    });

    describe('groupNameSource: smart_preset', () => {
      it('falls back to the presetId', () => {
        const rule = createMockRule({
          groupNameSource: 'smart_preset',
          presetId: 'github-issues',
          titleParsingRegEx: 'NoMatch'
        });
        const tab = createMockTab({ title: 'No match' });

        const result = extractGroupNameFromRule(rule, tab);

        expect(result).toBe('github-issues');
      });

      it('tries the URL when the title yields nothing, even without a presetId', () => {
        const rule = createMockRule({
          groupNameSource: 'smart_preset',
          // no presetId: this case used to return null without trying the URL.
          titleParsingRegEx: 'NoMatch - (\\w+)',
          urlParsingRegEx: 'example\\.com/(\\w+)',
          label: 'My Rule'
        });
        const tab = createMockTab({
          title: 'Test Page - Example',
          url: 'https://example.com/products/item'
        });

        const result = extractGroupNameFromRule(rule, tab);

        expect(result).toBe('products');
      });
    });

    describe('groupNameSource: smart (without presetId)', () => {
      it('tries title then URL for a manual rule without presetId', () => {
        const rule = createMockRule({
          groupNameSource: 'smart',
          titleParsingRegEx: 'NoMatch',
          urlParsingRegEx: 'example\\.com/(\\w+)',
          label: 'Manual Rule'
        });
        const tab = createMockTab({ url: 'https://example.com/projects/alpha' });

        const result = extractGroupNameFromRule(rule, tab);

        expect(result).toBe('projects');
      });

      it('returns null when no extraction succeeds', () => {
        const rule = createMockRule({
          groupNameSource: 'smart',
          titleParsingRegEx: 'NoMatch',
          urlParsingRegEx: 'NoMatch',
          label: 'Should Not Be Used'
        });
        const tab = createMockTab({ title: 'No match', url: 'https://example.com/page' });

        const result = extractGroupNameFromRule(rule, tab);

        expect(result).toBeNull();
      });
    });

    it('handles an invalid regex gracefully and returns null', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const rule = createMockRule({
        groupNameSource: 'title',
        titleParsingRegEx: '[invalid(regex',
        label: 'Fallback'
      });
      const tab = createMockTab({ title: 'Test' });

      const result = extractGroupNameFromRule(rule, tab);

      expect(result).toBeNull();
      consoleSpy.mockRestore();
    });

    it('trims the extracted name', () => {
      const rule = createMockRule({
        groupNameSource: 'title',
        titleParsingRegEx: 'Page - (.*)'
      });
      const tab = createMockTab({ title: 'Page -   Spaced Name   ' });

      const result = extractGroupNameFromRule(rule, tab);

      expect(result).toBe('Spaced Name');
    });
  });

  describe('createGroupingContext', () => {
    it('creates a complete grouping context', () => {
      const rule = createMockRule({
        label: 'Test Rule',
        color: 'green',
        groupNameSource: 'title',
        titleParsingRegEx: 'Page - (\\w+)'
      });
      const openerTab = createMockTab({ id: 1, title: 'Page - Projects' });
      const newTab = createMockTab({ id: 2 });
      const settings = {};

      const context = createGroupingContext(rule, openerTab, newTab, settings);

      expect(context.rule).toBe(rule);
      expect(context.groupName).toBe('Projects');
      expect(context.groupColor).toBe('green');
      expect(context.openerTab).toBe(openerTab);
      expect(context.newTab).toBe(newTab);
    });

    it('returns null when extraction fails (no label fallback)', () => {
      const rule = createMockRule({
        label: 'Default Label',
        groupNameSource: 'title',
        titleParsingRegEx: ''
      });
      const openerTab = createMockTab({ title: 'Any Title' });
      const newTab = createMockTab({ id: 2 });

      const context = createGroupingContext(rule, openerTab, newTab, {});

      expect(context).toBeNull();
    });
  });

  describe('urlExtractionMode: query_param', () => {
    it('extracts the group name from the q parameter (Google SERP)', () => {
      const rule = createMockRule({
        groupNameSource: 'url',
        urlExtractionMode: 'query_param',
        urlQueryParamName: 'q',
      });
      const tab = createMockTab({ url: 'https://google.com/search?q=hello+world' });

      const result = extractGroupNameFromRule(rule, tab);
      expect(result).toBe('hello world');
    });

    it('uses the search_query param (YouTube SERP)', () => {
      const rule = createMockRule({
        groupNameSource: 'url',
        urlExtractionMode: 'query_param',
        urlQueryParamName: 'search_query',
      });
      const tab = createMockTab({ url: 'https://www.youtube.com/results?search_query=hello%20world' });

      const result = extractGroupNameFromRule(rule, tab);
      expect(result).toBe('hello world');
    });

    it('returns null in strict url mode when the parameter is missing', () => {
      const rule = createMockRule({
        groupNameSource: 'url',
        urlExtractionMode: 'query_param',
        urlQueryParamName: 'q',
      });
      const tab = createMockTab({ url: 'https://google.com/search', title: '' });

      const result = extractGroupNameFromRule(rule, tab);
      expect(result).toBeNull();
    });

    it('falls back to the label in smart_label mode when the parameter is empty', () => {
      const rule = createMockRule({
        label: 'My Label',
        groupNameSource: 'smart_label',
        urlExtractionMode: 'query_param',
        urlQueryParamName: 'q',
      });
      const tab = createMockTab({ url: 'https://google.com/search?q=', title: '' });

      const result = extractGroupNameFromRule(rule, tab);
      expect(result).toBe('My Label');
    });

    it('falls back to the label in smart_label mode when the URL is invalid', () => {
      const rule = createMockRule({
        label: 'My Label',
        groupNameSource: 'smart_label',
        urlExtractionMode: 'query_param',
        urlQueryParamName: 'q',
      });
      const tab = createMockTab({ url: 'not-a-url', title: '' });

      const result = extractGroupNameFromRule(rule, tab);
      expect(result).toBe('My Label');
    });

    it('prefers the title then the URL in smart mode (title regex before query param)', () => {
      const rule = createMockRule({
        groupNameSource: 'smart',
        urlExtractionMode: 'query_param',
        urlQueryParamName: 'q',
        titleParsingRegEx: 'Title (.+)',
      });
      const tab = createMockTab({
        url: 'https://google.com/search?q=fallback+value',
        title: 'Title from-title',
      });

      const result = extractGroupNameFromRule(rule, tab);
      expect(result).toBe('from-title');
    });

    it('falls back to the query param in smart mode when the title regex fails', () => {
      const rule = createMockRule({
        groupNameSource: 'smart',
        urlExtractionMode: 'query_param',
        urlQueryParamName: 'q',
        titleParsingRegEx: 'NoMatch (.+)',
      });
      const tab = createMockTab({
        url: 'https://google.com/search?q=from+url',
        title: 'No regex match here',
      });

      const result = extractGroupNameFromRule(rule, tab);
      expect(result).toBe('from url');
    });
  });
});
