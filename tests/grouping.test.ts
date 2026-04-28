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

    it('devrait matcher les sous-domaines implicitement (plain domain)', () => {
      const rules: DomainRuleSetting[] = [
        createMockRule({ domainFilter: 'example.com' })
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

  describe('findMatchingRules', () => {
    it('retourne toutes les règles activées correspondant au domaine, dans l\'ordre', () => {
      const rules: DomainRuleSetting[] = [
        createMockRule({ domainFilter: 'example.com', label: 'First' }),
        createMockRule({ domainFilter: 'example.com', label: 'Second' }),
        createMockRule({ domainFilter: 'other.com', label: 'Other' }),
      ];

      const result = findMatchingRules('https://example.com/page', rules);

      expect(result.map(r => r.label)).toEqual(['First', 'Second']);
    });

    it('ignore les règles désactivées', () => {
      const rules: DomainRuleSetting[] = [
        createMockRule({ domainFilter: 'example.com', label: 'Off', enabled: false }),
        createMockRule({ domainFilter: 'example.com', label: 'On' }),
      ];

      const result = findMatchingRules('https://example.com/page', rules);

      expect(result.map(r => r.label)).toEqual(['On']);
    });

    it('retourne un tableau vide quand aucune règle ne correspond', () => {
      const rules: DomainRuleSetting[] = [
        createMockRule({ domainFilter: 'other.com' }),
      ];

      expect(findMatchingRules('https://example.com/page', rules)).toEqual([]);
    });
  });

  describe('findGroupingRuleForTab', () => {
    it('saute la première règle si son extraction échoue et utilise la suivante', () => {
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

    it('retourne null si aucune règle ne produit un nom de groupe', () => {
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

    it('saute les règles dont groupingEnabled est faux', () => {
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

    it('retourne la première règle qui réussit (ordre préservé)', () => {
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

    it('coerce manual et smart_manual en smart_label quand demandé', () => {
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

    it('retourne null quand l\'URL est absente', () => {
      const rules: DomainRuleSetting[] = [
        createMockRule({ domainFilter: 'example.com', groupingEnabled: true }),
      ];
      const tab = createMockTab({ url: undefined });

      expect(findGroupingRuleForTab(tab, rules)).toBeNull();
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

      it('devrait retourner null si le titre et l\'URL ne trouvent rien', () => {
        const rule = createMockRule({
          groupNameSource: 'title',
          titleParsingRegEx: 'NoMatch - (\\w+)',
          label: 'Fallback Label'
        });
        const tab = createMockTab({ title: 'Test Page - Example' });

        const result = extractGroupNameFromRule(rule, tab);

        expect(result).toBeNull();
      });

      it('devrait retourner null si pas de label et aucune extraction', () => {
        const rule = createMockRule({
          groupNameSource: 'title',
          titleParsingRegEx: 'NoMatch',
          label: ''
        });
        const tab = createMockTab({ title: 'Test Page' });

        const result = extractGroupNameFromRule(rule, tab);

        expect(result).toBeNull();
      });

      it('devrait utiliser l\'URL comme fallback si le titre ne donne rien', () => {
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
      it('devrait extraire le nom du groupe depuis l\'URL avec regex', () => {
        const rule = createMockRule({
          groupNameSource: 'url',
          urlParsingRegEx: 'example\\.com/(\\w+)'
        });
        const tab = createMockTab({ url: 'https://example.com/products/item' });

        const result = extractGroupNameFromRule(rule, tab);

        expect(result).toBe('products');
      });

      it('devrait retourner null si l\'URL et le titre ne trouvent rien', () => {
        const rule = createMockRule({
          groupNameSource: 'url',
          urlParsingRegEx: 'nomatch/(\\w+)',
          label: 'URL Fallback'
        });
        const tab = createMockTab({ url: 'https://example.com/page' });

        const result = extractGroupNameFromRule(rule, tab);

        expect(result).toBeNull();
      });

      it('devrait utiliser le titre comme fallback si l\'URL ne donne rien', () => {
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

      it('devrait essayer l\'URL si le titre ne donne rien, même sans presetId', () => {
        const rule = createMockRule({
          groupNameSource: 'smart_preset',
          // pas de presetId : anciennement ce cas retournait null sans essayer l'URL
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

    describe('groupNameSource: smart (sans presetId)', () => {
      it('devrait essayer titre puis URL pour une règle manuelle sans presetId', () => {
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

      it('devrait retourner null si aucune extraction ne réussit', () => {
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

    it('devrait gérer une regex invalide gracieusement et retourner null', () => {
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

    it('devrait retourner null quand l\'extraction échoue (pas de fallback label)', () => {
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
    it('extrait le nom de groupe depuis le paramètre q (Google SERP)', () => {
      const rule = createMockRule({
        groupNameSource: 'url',
        urlExtractionMode: 'query_param',
        urlQueryParamName: 'q',
      });
      const tab = createMockTab({ url: 'https://google.com/search?q=hello+world' });

      const result = extractGroupNameFromRule(rule, tab);
      expect(result).toBe('hello world');
    });

    it('utilise le param search_query (YouTube SERP)', () => {
      const rule = createMockRule({
        groupNameSource: 'url',
        urlExtractionMode: 'query_param',
        urlQueryParamName: 'search_query',
      });
      const tab = createMockTab({ url: 'https://www.youtube.com/results?search_query=hello%20world' });

      const result = extractGroupNameFromRule(rule, tab);
      expect(result).toBe('hello world');
    });

    it('retourne null en mode url strict quand le paramètre est absent', () => {
      const rule = createMockRule({
        groupNameSource: 'url',
        urlExtractionMode: 'query_param',
        urlQueryParamName: 'q',
      });
      const tab = createMockTab({ url: 'https://google.com/search', title: '' });

      const result = extractGroupNameFromRule(rule, tab);
      expect(result).toBeNull();
    });

    it('fallback sur le label en mode smart_label quand le paramètre est vide', () => {
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

    it('fallback sur le label en mode smart_label quand l\'URL est invalide', () => {
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

    it('priorise le titre puis l\'URL en mode smart (titre regex avant query param)', () => {
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

    it('utilise le query param en fallback en mode smart quand le titre regex échoue', () => {
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
