import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  findMatchingRule,
  determineGroupColor,
  extractGroupNameFromRule,
  createGroupingContext
} from '../src/background/grouping';
import type { DomainRuleSetting } from '../src/types/syncSettings';

// Mock pour éviter les imports du module browser
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

// Mock des modules dépendants
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

// Type pour les tabs mockés
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
    it('devrait trouver une règle correspondante pour une URL', () => {
      const rules: DomainRuleSetting[] = [
        createMockRule({ domainFilter: 'example.com', label: 'Example Rule' }),
        createMockRule({ domainFilter: 'other.com', label: 'Other Rule' })
      ];

      const result = findMatchingRule('https://example.com/page', rules);

      expect(result).toBeDefined();
      expect(result?.label).toBe('Example Rule');
    });

    it('devrait retourner undefined si aucune règle ne correspond', () => {
      const rules: DomainRuleSetting[] = [
        createMockRule({ domainFilter: 'other.com' })
      ];

      const result = findMatchingRule('https://example.com/page', rules);

      expect(result).toBeUndefined();
    });

    it('devrait ignorer les règles désactivées', () => {
      const rules: DomainRuleSetting[] = [
        createMockRule({ domainFilter: 'example.com', enabled: false }),
        createMockRule({ domainFilter: 'example.com', enabled: true, label: 'Active Rule' })
      ];

      const result = findMatchingRule('https://example.com/page', rules);

      expect(result?.label).toBe('Active Rule');
    });

    it('devrait supporter les wildcards dans le domainFilter', () => {
      const rules: DomainRuleSetting[] = [
        createMockRule({ domainFilter: '*.example.com' })
      ];

      const result = findMatchingRule('https://sub.example.com/page', rules);

      expect(result).toBeDefined();
    });

    it('devrait retourner la première règle correspondante', () => {
      const rules: DomainRuleSetting[] = [
        createMockRule({ domainFilter: 'example.com', label: 'First' }),
        createMockRule({ domainFilter: 'example.com', label: 'Second' })
      ];

      const result = findMatchingRule('https://example.com/page', rules);

      expect(result?.label).toBe('First');
    });
  });

  describe('determineGroupColor', () => {
    it('devrait retourner la couleur de la règle si définie', () => {
      const rule = createMockRule({ color: 'blue' });

      const result = determineGroupColor(rule, {});

      expect(result).toBe('blue');
    });

    it('devrait retourner null si aucune couleur dans la règle', () => {
      const rule = createMockRule({ color: undefined });

      const result = determineGroupColor(rule, {});

      expect(result).toBeNull();
    });

    it('devrait retourner null pour une couleur vide', () => {
      const rule = createMockRule({ color: '' });

      const result = determineGroupColor(rule, {});

      // Une chaîne vide est falsy, donc null
      expect(result).toBeNull();
    });
  });

  describe('extractGroupNameFromRule', () => {
    describe('groupNameSource: title', () => {
      it('devrait extraire le nom du groupe depuis le titre avec regex', () => {
        const rule = createMockRule({
          groupNameSource: 'title',
          titleParsingRegEx: 'Test Page - (\\w+)'
        });
        const tab = createMockTab({ title: 'Test Page - Example' });

        const result = extractGroupNameFromRule(rule, tab);

        expect(result).toBe('Example');
      });

      it('devrait utiliser le label si l\'extraction échoue', () => {
        const rule = createMockRule({
          groupNameSource: 'title',
          titleParsingRegEx: 'NoMatch - (\\w+)',
          label: 'Fallback Label'
        });
        const tab = createMockTab({ title: 'Test Page - Example' });

        const result = extractGroupNameFromRule(rule, tab);

        expect(result).toBe('Fallback Label');
      });

      it('devrait utiliser SmartGroup si pas de label', () => {
        const rule = createMockRule({
          groupNameSource: 'title',
          titleParsingRegEx: 'NoMatch',
          label: ''
        });
        const tab = createMockTab({ title: 'Test Page' });

        const result = extractGroupNameFromRule(rule, tab);

        expect(result).toBe('SmartGroup');
      });
    });

    describe('groupNameSource: url', () => {
      it('devrait extraire le nom du groupe depuis l\'URL avec regex', () => {
        const rule = createMockRule({
          groupNameSource: 'url',
          urlParsingRegEx: 'example\\.com/(\\w+)'
        });
        const tab = createMockTab({ url: 'https://example.com/products/item' });

        const result = extractGroupNameFromRule(rule, tab);

        expect(result).toBe('products');
      });

      it('devrait utiliser le label si l\'extraction échoue', () => {
        const rule = createMockRule({
          groupNameSource: 'url',
          urlParsingRegEx: 'nomatch/(\\w+)',
          label: 'URL Fallback'
        });
        const tab = createMockTab({ url: 'https://example.com/page' });

        const result = extractGroupNameFromRule(rule, tab);

        expect(result).toBe('URL Fallback');
      });
    });

    describe('groupNameSource: smart_label', () => {
      it('devrait utiliser le label comme fallback si pas d\'extraction', () => {
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
      it('devrait utiliser le presetId comme fallback', () => {
        const rule = createMockRule({
          groupNameSource: 'smart_preset',
          presetId: 'github-issues',
          titleParsingRegEx: 'NoMatch'
        });
        const tab = createMockTab({ title: 'No match' });

        const result = extractGroupNameFromRule(rule, tab);

        expect(result).toBe('github-issues');
      });
    });

    it('devrait gérer une regex invalide gracieusement', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const rule = createMockRule({
        groupNameSource: 'title',
        titleParsingRegEx: '[invalid(regex',
        label: 'Fallback'
      });
      const tab = createMockTab({ title: 'Test' });

      const result = extractGroupNameFromRule(rule, tab);

      expect(result).toBe('Fallback');
      consoleSpy.mockRestore();
    });

    it('devrait trimmer le nom extrait', () => {
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
    it('devrait créer un contexte de groupage complet', () => {
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

    it('devrait utiliser le label comme nom de groupe par défaut', () => {
      const rule = createMockRule({
        label: 'Default Label',
        groupNameSource: 'title',
        titleParsingRegEx: ''
      });
      const openerTab = createMockTab({ title: 'Any Title' });
      const newTab = createMockTab({ id: 2 });

      const context = createGroupingContext(rule, openerTab, newTab, {});

      expect(context.groupName).toBe('Default Label');
    });
  });
});
