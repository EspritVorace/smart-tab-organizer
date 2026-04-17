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
    it('devrait retourner global && deduplicateUnmatched si aucune règle', () => {
      expect(isDeduplicationEnabled(undefined, true, true)).toBe(true);
      expect(isDeduplicationEnabled(undefined, false, true)).toBe(false);
      expect(isDeduplicationEnabled(undefined, true, false)).toBe(false);
      expect(isDeduplicationEnabled(undefined, false, false)).toBe(false);
    });

    it('devrait retourner la valeur de la règle si présente, indépendamment du flag unmatched', () => {
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

    describe('mode exact_ignore_params', () => {
      it('devrait matcher quand seul un param ignoré diffère', () => {
        expect(
          isUrlMatch(
            'https://example.com/page?utm_source=a&ref=x',
            'https://example.com/page?utm_source=b&ref=x',
            'exact_ignore_params',
            ['utm_source'],
          ),
        ).toBe(true);
      });

      it('devrait matcher avec un wildcard simple', () => {
        expect(
          isUrlMatch(
            'https://example.com/page?utm_source=a&utm_medium=x&keep=1',
            'https://example.com/page?utm_source=b&utm_campaign=y&keep=1',
            'exact_ignore_params',
            ['utm_*'],
          ),
        ).toBe(true);
      });

      it('ne devrait pas matcher quand un param non ignoré diffère', () => {
        expect(
          isUrlMatch(
            'https://example.com/page?utm_source=a&ref=x',
            'https://example.com/page?utm_source=b&ref=y',
            'exact_ignore_params',
            ['utm_source'],
          ),
        ).toBe(false);
      });

      it('ne devrait pas matcher quand le path diffère', () => {
        expect(
          isUrlMatch(
            'https://example.com/a?utm_source=a',
            'https://example.com/b?utm_source=a',
            'exact_ignore_params',
            ['utm_source'],
          ),
        ).toBe(false);
      });

      it('se comporte comme exact quand aucun param ignoré fourni', () => {
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

    it('devrait trouver un dupliqué en mode exact_ignore_params (wildcard)', async () => {
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

    it('ne devrait pas trouver de dupliqué quand un param non ignoré diffère', async () => {
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
      it('garde l\'ancien quand aucun n\'est groupé', () => {
        const { tabToKeep, tabToClose } = decideDedupDirection(oldUngrouped, newUngrouped, 'keep-old');
        expect(tabToKeep.id).toBe(1);
        expect(tabToClose.id).toBe(2);
      });

      it('garde l\'ancien quand l\'ancien est groupé', () => {
        const { tabToKeep } = decideDedupDirection(oldGrouped, newUngrouped, 'keep-old');
        expect(tabToKeep.id).toBe(1);
      });

      it('garde l\'ancien même quand le nouveau est groupé', () => {
        const { tabToKeep } = decideDedupDirection(oldUngrouped, newGrouped, 'keep-old');
        expect(tabToKeep.id).toBe(1);
      });
    });

    describe('keep-new', () => {
      it('garde le nouveau quand aucun n\'est groupé', () => {
        const { tabToKeep, tabToClose } = decideDedupDirection(oldUngrouped, newUngrouped, 'keep-new');
        expect(tabToKeep.id).toBe(2);
        expect(tabToClose.id).toBe(1);
      });

      it('garde le nouveau même quand l\'ancien est groupé', () => {
        const { tabToKeep } = decideDedupDirection(oldGrouped, newUngrouped, 'keep-new');
        expect(tabToKeep.id).toBe(2);
      });

      it('garde le nouveau quand le nouveau est groupé', () => {
        const { tabToKeep } = decideDedupDirection(oldUngrouped, newGrouped, 'keep-new');
        expect(tabToKeep.id).toBe(2);
      });
    });

    describe('keep-grouped', () => {
      it('garde celui qui est groupé (ancien groupé)', () => {
        const { tabToKeep, tabToClose } = decideDedupDirection(oldGrouped, newUngrouped, 'keep-grouped');
        expect(tabToKeep.id).toBe(1);
        expect(tabToClose.id).toBe(2);
      });

      it('garde celui qui est groupé (nouveau groupé)', () => {
        const { tabToKeep, tabToClose } = decideDedupDirection(oldUngrouped, newGrouped, 'keep-grouped');
        expect(tabToKeep.id).toBe(2);
        expect(tabToClose.id).toBe(1);
      });

      it('retombe sur keep-old quand aucun n\'est groupé', () => {
        const { tabToKeep } = decideDedupDirection(oldUngrouped, newUngrouped, 'keep-grouped');
        expect(tabToKeep.id).toBe(1);
      });

      it('retombe sur keep-old quand les deux sont groupés', () => {
        const { tabToKeep } = decideDedupDirection(oldGrouped, newGrouped, 'keep-grouped');
        expect(tabToKeep.id).toBe(1);
      });
    });

    describe('keep-grouped-or-new', () => {
      it('garde celui qui est groupé (ancien groupé)', () => {
        const { tabToKeep, tabToClose } = decideDedupDirection(oldGrouped, newUngrouped, 'keep-grouped-or-new');
        expect(tabToKeep.id).toBe(1);
        expect(tabToClose.id).toBe(2);
      });

      it('garde celui qui est groupé (nouveau groupé)', () => {
        const { tabToKeep, tabToClose } = decideDedupDirection(oldUngrouped, newGrouped, 'keep-grouped-or-new');
        expect(tabToKeep.id).toBe(2);
        expect(tabToClose.id).toBe(1);
      });

      it('retombe sur keep-new quand aucun n\'est groupé', () => {
        const { tabToKeep } = decideDedupDirection(oldUngrouped, newUngrouped, 'keep-grouped-or-new');
        expect(tabToKeep.id).toBe(2);
      });

      it('retombe sur keep-new quand les deux sont groupés', () => {
        const { tabToKeep } = decideDedupDirection(oldGrouped, newGrouped, 'keep-grouped-or-new');
        expect(tabToKeep.id).toBe(2);
      });
    });
  });
});
