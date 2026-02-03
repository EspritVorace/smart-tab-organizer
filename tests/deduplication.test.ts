import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isDeduplicationEnabled,
  getMatchMode,
  shouldProcessTab,
  markTabAsProcessed,
  clearProcessedTabsCache,
  isUrlMatch,
  findDuplicateTab
} from '../src/background/deduplication';
import type { DomainRuleSetting } from '../src/types/syncSettings';

// Mock du module wxt/browser - doit être avant les imports
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

// Mock des dépendances
vi.mock('../src/utils/statisticsUtils.js', () => ({
  incrementStat: vi.fn()
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
    it('devrait retourner la valeur globale si aucune règle', () => {
      expect(isDeduplicationEnabled(undefined, true)).toBe(true);
      expect(isDeduplicationEnabled(undefined, false)).toBe(false);
    });

    it('devrait retourner la valeur de la règle si présente', () => {
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

      expect(isDeduplicationEnabled(ruleEnabled, false)).toBe(true);
      expect(isDeduplicationEnabled(ruleDisabled, true)).toBe(false);
    });
  });

  describe('getMatchMode', () => {
    it('devrait retourner exact par défaut sans règle', () => {
      expect(getMatchMode(undefined)).toBe('exact');
    });

    it('devrait retourner le mode de la règle', () => {
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
    it('devrait retourner false pour une URL vide', () => {
      expect(shouldProcessTab('', 1)).toBe(false);
    });

    it('devrait retourner false pour les URLs about:', () => {
      expect(shouldProcessTab('about:blank', 1)).toBe(false);
      expect(shouldProcessTab('about:newtab', 1)).toBe(false);
    });

    it('devrait retourner false pour les URLs chrome:', () => {
      expect(shouldProcessTab('chrome://extensions', 1)).toBe(false);
      expect(shouldProcessTab('chrome://settings', 1)).toBe(false);
    });

    it('devrait retourner true pour une URL web normale', () => {
      expect(shouldProcessTab('https://example.com', 1)).toBe(true);
    });

    it('devrait retourner false pour un onglet déjà traité', () => {
      expect(shouldProcessTab('https://example.com', 1)).toBe(true);
      markTabAsProcessed(1, 'https://example.com');
      expect(shouldProcessTab('https://example.com', 1)).toBe(false);
    });
  });

  describe('markTabAsProcessed / clearProcessedTabsCache', () => {
    it('devrait marquer un onglet comme traité', () => {
      expect(shouldProcessTab('https://example.com', 1)).toBe(true);
      markTabAsProcessed(1, 'https://example.com');
      expect(shouldProcessTab('https://example.com', 1)).toBe(false);
    });

    it('devrait permettre le même onglet avec une URL différente', () => {
      markTabAsProcessed(1, 'https://example.com/page1');
      expect(shouldProcessTab('https://example.com/page2', 1)).toBe(true);
    });

    it('devrait effacer le cache', () => {
      markTabAsProcessed(1, 'https://example.com');
      clearProcessedTabsCache();
      expect(shouldProcessTab('https://example.com', 1)).toBe(true);
    });
  });

  describe('isUrlMatch', () => {
    describe('mode exact', () => {
      it('devrait matcher des URLs identiques', () => {
        expect(isUrlMatch('https://example.com/page', 'https://example.com/page', 'exact')).toBe(true);
      });

      it('devrait ne pas matcher des URLs différentes', () => {
        expect(isUrlMatch('https://example.com/page1', 'https://example.com/page2', 'exact')).toBe(false);
      });

      it('devrait être sensible aux query params', () => {
        expect(isUrlMatch('https://example.com/page', 'https://example.com/page?foo=bar', 'exact')).toBe(false);
      });
    });

    describe('mode includes', () => {
      it('devrait matcher si la nouvelle URL contient l\'ancienne', () => {
        expect(isUrlMatch('https://example.com', 'https://example.com/page', 'includes')).toBe(true);
      });

      it('devrait matcher si l\'ancienne URL contient la nouvelle', () => {
        expect(isUrlMatch('https://example.com/page', 'https://example.com', 'includes')).toBe(true);
      });

      it('devrait ne pas matcher des URLs sans inclusion', () => {
        expect(isUrlMatch('https://foo.com', 'https://bar.com', 'includes')).toBe(false);
      });
    });

    describe('mode inconnu', () => {
      it('devrait retourner false pour un mode inconnu', () => {
        expect(isUrlMatch('https://example.com', 'https://example.com', 'unknown')).toBe(false);
      });
    });
  });

  describe('findDuplicateTab', () => {
    it('devrait trouver un onglet dupliqué avec le mode exact', async () => {
      // Configurer les onglets simulés
      vi.mocked(browser.tabs.query).mockResolvedValue([
        { id: 1, url: 'https://example.com/page', windowId: 1 },
        { id: 2, url: 'https://other.com', windowId: 1 }
      ] as any);

      const duplicate = await findDuplicateTab(3, 'https://example.com/page', 'exact', 1);

      expect(duplicate).toBeDefined();
      expect(duplicate?.id).toBe(1);
    });

    it('devrait ne pas trouver de dupliqué si l\'ID est le même', async () => {
      vi.mocked(browser.tabs.query).mockResolvedValue([
        { id: 1, url: 'https://example.com/page', windowId: 1 }
      ] as any);

      const duplicate = await findDuplicateTab(1, 'https://example.com/page', 'exact', 1);

      expect(duplicate).toBeUndefined();
    });

    it('devrait ne pas trouver de dupliqué si aucune URL ne matche', async () => {
      vi.mocked(browser.tabs.query).mockResolvedValue([
        { id: 1, url: 'https://other.com', windowId: 1 }
      ] as any);

      const duplicate = await findDuplicateTab(2, 'https://example.com/page', 'exact', 1);

      expect(duplicate).toBeUndefined();
    });

    it('devrait trouver un dupliqué avec le mode includes', async () => {
      vi.mocked(browser.tabs.query).mockResolvedValue([
        { id: 1, url: 'https://example.com/page/subpage', windowId: 1 }
      ] as any);

      const duplicate = await findDuplicateTab(2, 'https://example.com/page', 'includes', 1);

      expect(duplicate).toBeDefined();
      expect(duplicate?.id).toBe(1);
    });
  });
});
