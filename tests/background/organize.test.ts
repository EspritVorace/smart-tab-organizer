import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { DomainRuleSetting } from '../../src/types/syncSettings';
import { makeRule, makeSettings, type MockedBrowser } from './_helpers';

// ---- Mocks ------------------------------------------------------------------

vi.mock('wxt/browser', async () => ({ browser: (await import('./_helpers')).browserMock() }));

vi.mock('../../src/background/settings.js', () => ({
  getSettings: vi.fn(),
}));

vi.mock('../../src/background/grouping.js', () => ({
  findMatchingRule: vi.fn(),
  extractGroupNameFromRule: vi.fn(),
  determineGroupColor: vi.fn(),
  createNewGroup: vi.fn(),
  addToExistingGroup: vi.fn(),
}));

vi.mock('../../src/background/deduplication.js', () => ({
  getMatchMode: vi.fn((rule?: DomainRuleSetting) =>
    rule?.deduplicationMatchMode ?? 'exact',
  ),
  isUrlMatch: vi.fn((a: string, b: string, mode: string) => {
    if (mode === 'exact') return a === b;
    return a.includes(b) || b.includes(a);
  }),
}));

vi.mock('../../src/utils/statisticsUtils.js', () => ({
  getStatisticsData: vi.fn(),
  updateStatisticsData: vi.fn(),
}));

vi.mock('../../src/utils/i18n.js', () => ({
  getMessage: vi.fn((k: string) => k),
}));

// ---- Imports after mocks ----------------------------------------------------

import { handleOrganizeAllTabs } from '../../src/background/organize';
import { browser } from 'wxt/browser';
import { getSettings } from '../../src/background/settings';
import {
  findMatchingRule,
  extractGroupNameFromRule,
  determineGroupColor,
  createNewGroup,
  addToExistingGroup,
} from '../../src/background/grouping';
import {
  getStatisticsData,
  updateStatisticsData,
} from '../../src/utils/statisticsUtils';

// ---- Typed mock accessors ---------------------------------------------------

const mockedBrowser = browser as unknown as MockedBrowser;
const mockedGetSettings = getSettings as ReturnType<typeof vi.fn>;
const mockedFindMatchingRule = findMatchingRule as ReturnType<typeof vi.fn>;
const mockedExtractGroupName = extractGroupNameFromRule as ReturnType<typeof vi.fn>;
const mockedDetermineColor = determineGroupColor as ReturnType<typeof vi.fn>;
const mockedCreateGroup = createNewGroup as ReturnType<typeof vi.fn>;
const mockedAddToGroup = addToExistingGroup as ReturnType<typeof vi.fn>;
const mockedGetStats = getStatisticsData as ReturnType<typeof vi.fn>;
const mockedUpdateStats = updateStatisticsData as ReturnType<typeof vi.fn>;

function makeTab(
  id: number,
  url: string,
  overrides: Partial<{ index: number; groupId: number }> = {},
) {
  return {
    id,
    url,
    index: overrides.index ?? id,
    groupId: overrides.groupId ?? -1,
    title: '',
  };
}

// ---- Tests ------------------------------------------------------------------

describe('handleOrganizeAllTabs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetStats.mockResolvedValue({ tabsDeduplicatedCount: 0, groupsCreatedCount: 0 });
    mockedUpdateStats.mockResolvedValue(undefined);
    mockedBrowser.tabs.reload.mockResolvedValue(undefined);
    mockedBrowser.tabs.remove.mockResolvedValue(undefined);
    mockedBrowser.tabGroups.query.mockResolvedValue([]);
    mockedBrowser.tabGroups.move.mockResolvedValue(undefined);
    mockedBrowser.tabGroups.update.mockResolvedValue(undefined);
    mockedBrowser.notifications.create.mockResolvedValue('id');
  });

  describe('deduplication', () => {
    it('removes exact-URL duplicates keeping the first, then updates stats', async () => {
      const rule = makeRule({ deduplicationMatchMode: 'exact' });
      mockedGetSettings.mockResolvedValue(makeSettings({ domainRules: [rule] }));

      mockedBrowser.tabs.query.mockResolvedValueOnce([
        makeTab(1, 'https://example.com/a', { index: 0 }),
        makeTab(2, 'https://example.com/a', { index: 1 }),
        makeTab(3, 'https://example.com/b', { index: 2 }),
        makeTab(4, 'chrome://settings', { index: 3 }),
      ]);
      mockedBrowser.tabs.query.mockResolvedValueOnce([]);

      mockedFindMatchingRule.mockReturnValue(rule);

      await handleOrganizeAllTabs(42);

      expect(mockedBrowser.tabs.remove).toHaveBeenCalledWith([2]);
      expect(mockedBrowser.tabs.reload).toHaveBeenCalledWith(1);
      expect(mockedBrowser.tabs.reload).toHaveBeenCalledWith(3);
      expect(mockedUpdateStats).toHaveBeenCalledWith({ tabsDeduplicatedCount: 1 });
      expect(mockedBrowser.notifications.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'basic',
          title: 'extensionName',
          message: 'notifDeduplication',
        }),
      );
    });

    it('applies "includes" match mode via isUrlMatch', async () => {
      const rule = makeRule({ deduplicationMatchMode: 'includes' });
      mockedGetSettings.mockResolvedValue(makeSettings({ domainRules: [rule] }));

      mockedBrowser.tabs.query.mockResolvedValueOnce([
        makeTab(1, 'https://example.com/page?x=1', { index: 0 }),
        makeTab(2, 'https://example.com/page', { index: 1 }),
      ]);
      mockedBrowser.tabs.query.mockResolvedValueOnce([]);

      mockedFindMatchingRule.mockReturnValue(rule);

      await handleOrganizeAllTabs(1);

      expect(mockedBrowser.tabs.remove).toHaveBeenCalledWith([2]);
    });

    it('skips tabs whose rule is disabled or has dedup off', async () => {
      const disabledRule = makeRule({ enabled: false });
      const dedupOffRule = makeRule({ id: 'r2', deduplicationEnabled: false });
      mockedGetSettings.mockResolvedValue(
        makeSettings({ domainRules: [disabledRule, dedupOffRule] }),
      );

      mockedBrowser.tabs.query.mockResolvedValueOnce([
        makeTab(1, 'https://a.com/x', { index: 0 }),
        makeTab(2, 'https://a.com/x', { index: 1 }),
      ]);
      mockedBrowser.tabs.query.mockResolvedValueOnce([]);

      mockedFindMatchingRule
        .mockReturnValueOnce(disabledRule)
        .mockReturnValueOnce(dedupOffRule);

      await handleOrganizeAllTabs(1);

      expect(mockedBrowser.tabs.remove).not.toHaveBeenCalled();
      expect(mockedUpdateStats).not.toHaveBeenCalled();
      expect(mockedBrowser.notifications.create).not.toHaveBeenCalled();
    });

    it('does not show dedup notification when notifyOnDeduplication is false', async () => {
      const rule = makeRule();
      mockedGetSettings.mockResolvedValue(
        makeSettings({ domainRules: [rule], notifyOnDeduplication: false }),
      );

      mockedBrowser.tabs.query.mockResolvedValueOnce([
        makeTab(1, 'https://a.com/x', { index: 0 }),
        makeTab(2, 'https://a.com/x', { index: 1 }),
      ]);
      mockedBrowser.tabs.query.mockResolvedValueOnce([]);

      mockedFindMatchingRule.mockReturnValue(rule);

      await handleOrganizeAllTabs(1);

      expect(mockedBrowser.tabs.remove).toHaveBeenCalled();
      expect(mockedBrowser.notifications.create).not.toHaveBeenCalled();
    });

    it('swallows errors from tabs.remove without throwing', async () => {
      const rule = makeRule();
      mockedGetSettings.mockResolvedValue(makeSettings({ domainRules: [rule] }));
      mockedBrowser.tabs.remove.mockRejectedValueOnce(new Error('boom'));

      mockedBrowser.tabs.query.mockResolvedValueOnce([
        makeTab(1, 'https://a.com/x', { index: 0 }),
        makeTab(2, 'https://a.com/x', { index: 1 }),
      ]);
      mockedBrowser.tabs.query.mockResolvedValueOnce([]);

      mockedFindMatchingRule.mockReturnValue(rule);

      await expect(handleOrganizeAllTabs(1)).resolves.toBeUndefined();
    });
  });

  describe('grouping plan', () => {
    it('creates a new group when 2+ tabs share a target name and no existing group matches', async () => {
      const rule = makeRule();
      mockedGetSettings.mockResolvedValue(makeSettings({ domainRules: [rule] }));

      mockedBrowser.tabs.query.mockResolvedValueOnce([]);
      mockedBrowser.tabs.query.mockResolvedValueOnce([
        makeTab(10, 'https://x.com/a'),
        makeTab(11, 'https://x.com/b'),
      ]);

      mockedFindMatchingRule.mockReturnValue(rule);
      mockedExtractGroupName.mockReturnValue('My Group');
      mockedDetermineColor.mockReturnValue('blue');
      mockedBrowser.tabGroups.query.mockResolvedValue([]);

      await handleOrganizeAllTabs(1);

      expect(mockedCreateGroup).toHaveBeenCalledWith([10, 11], 'My Group', 'blue');
      expect(mockedAddToGroup).not.toHaveBeenCalled();
      expect(mockedBrowser.notifications.create).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'notifGrouping' }),
      );
    });

    it('adds to existing group when one with the same title already exists', async () => {
      const rule = makeRule();
      mockedGetSettings.mockResolvedValue(makeSettings({ domainRules: [rule] }));

      mockedBrowser.tabs.query.mockResolvedValueOnce([]);
      mockedBrowser.tabs.query.mockResolvedValueOnce([
        makeTab(20, 'https://x.com/a'),
        makeTab(21, 'https://x.com/b'),
      ]);

      mockedFindMatchingRule.mockReturnValue(rule);
      mockedExtractGroupName.mockReturnValue('Existing');
      mockedDetermineColor.mockReturnValue('purple');
      mockedBrowser.tabGroups.query
        .mockResolvedValueOnce([{ id: 99, title: 'Existing' }])
        .mockResolvedValueOnce([{ id: 99 }]);
      mockedBrowser.tabs.query.mockResolvedValueOnce([{ index: 0 }]);

      await handleOrganizeAllTabs(1);

      expect(mockedAddToGroup).toHaveBeenCalledWith(99, 20);
      expect(mockedAddToGroup).toHaveBeenCalledWith(99, 21);
      expect(mockedCreateGroup).not.toHaveBeenCalled();
    });

    it('excludes single-member target groups (US-PO008)', async () => {
      const rule = makeRule();
      mockedGetSettings.mockResolvedValue(makeSettings({ domainRules: [rule] }));

      mockedBrowser.tabs.query.mockResolvedValueOnce([]);
      mockedBrowser.tabs.query.mockResolvedValueOnce([
        makeTab(30, 'https://x.com/a'),
      ]);

      mockedFindMatchingRule.mockReturnValue(rule);
      mockedExtractGroupName.mockReturnValue('Solo');
      mockedDetermineColor.mockReturnValue('red');
      mockedBrowser.tabGroups.query.mockResolvedValue([]);

      await handleOrganizeAllTabs(1);

      expect(mockedCreateGroup).not.toHaveBeenCalled();
      expect(mockedAddToGroup).not.toHaveBeenCalled();
      expect(mockedBrowser.notifications.create).not.toHaveBeenCalled();
    });

    it('skips tabs whose rule has grouping disabled', async () => {
      const rule = makeRule({ groupingEnabled: false });
      mockedGetSettings.mockResolvedValue(makeSettings({ domainRules: [rule] }));

      mockedBrowser.tabs.query.mockResolvedValueOnce([]);
      mockedBrowser.tabs.query.mockResolvedValueOnce([
        makeTab(40, 'https://x.com/a'),
        makeTab(41, 'https://x.com/b'),
      ]);

      mockedFindMatchingRule.mockReturnValue(rule);
      mockedBrowser.tabGroups.query.mockResolvedValue([]);

      await handleOrganizeAllTabs(1);

      expect(mockedCreateGroup).not.toHaveBeenCalled();
    });

    it('overrides "manual" groupNameSource to "smart_label"', async () => {
      const rule = makeRule({ groupNameSource: 'manual' });
      mockedGetSettings.mockResolvedValue(makeSettings({ domainRules: [rule] }));

      mockedBrowser.tabs.query.mockResolvedValueOnce([]);
      mockedBrowser.tabs.query.mockResolvedValueOnce([
        makeTab(50, 'https://x.com/a'),
        makeTab(51, 'https://x.com/b'),
      ]);

      mockedFindMatchingRule.mockReturnValue(rule);
      mockedExtractGroupName.mockReturnValue('Example');
      mockedDetermineColor.mockReturnValue('blue');
      mockedBrowser.tabGroups.query.mockResolvedValue([]);

      await handleOrganizeAllTabs(1);

      const [passedRule] = mockedExtractGroupName.mock.calls[0];
      expect(passedRule.groupNameSource).toBe('smart_label');
    });

    it('does not re-move tabs that are already in the target group', async () => {
      const rule = makeRule();
      mockedGetSettings.mockResolvedValue(makeSettings({ domainRules: [rule] }));

      mockedBrowser.tabs.query.mockResolvedValueOnce([]);
      mockedBrowser.tabs.query.mockResolvedValueOnce([
        makeTab(60, 'https://x.com/a', { groupId: 77 }),
        makeTab(61, 'https://x.com/b', { groupId: 77 }),
      ]);

      mockedFindMatchingRule.mockReturnValue(rule);
      mockedExtractGroupName.mockReturnValue('Already There');
      mockedDetermineColor.mockReturnValue('blue');
      mockedBrowser.tabGroups.query
        .mockResolvedValueOnce([{ id: 77, title: 'Already There' }])
        .mockResolvedValueOnce([{ id: 77 }]);
      mockedBrowser.tabs.query.mockResolvedValueOnce([{ index: 0 }]);

      await handleOrganizeAllTabs(1);

      expect(mockedAddToGroup).not.toHaveBeenCalled();
      expect(mockedCreateGroup).not.toHaveBeenCalled();
    });

    it('does not show grouping notification when notifyOnGrouping is false', async () => {
      const rule = makeRule();
      mockedGetSettings.mockResolvedValue(
        makeSettings({ domainRules: [rule], notifyOnGrouping: false }),
      );

      mockedBrowser.tabs.query.mockResolvedValueOnce([]);
      mockedBrowser.tabs.query.mockResolvedValueOnce([
        makeTab(70, 'https://x.com/a'),
        makeTab(71, 'https://x.com/b'),
      ]);

      mockedFindMatchingRule.mockReturnValue(rule);
      mockedExtractGroupName.mockReturnValue('Work');
      mockedDetermineColor.mockReturnValue('blue');
      mockedBrowser.tabGroups.query.mockResolvedValue([]);

      await handleOrganizeAllTabs(1);

      expect(mockedCreateGroup).toHaveBeenCalled();
      expect(mockedBrowser.notifications.create).not.toHaveBeenCalled();
    });

    it('continues when createNewGroup throws for one target name', async () => {
      const rule = makeRule();
      mockedGetSettings.mockResolvedValue(makeSettings({ domainRules: [rule] }));

      mockedBrowser.tabs.query.mockResolvedValueOnce([]);
      mockedBrowser.tabs.query.mockResolvedValueOnce([
        makeTab(80, 'https://x.com/a'),
        makeTab(81, 'https://x.com/b'),
      ]);

      mockedFindMatchingRule.mockReturnValue(rule);
      mockedExtractGroupName.mockReturnValue('Fails');
      mockedDetermineColor.mockReturnValue('blue');
      mockedBrowser.tabGroups.query.mockResolvedValue([]);
      mockedCreateGroup.mockRejectedValueOnce(new Error('api error'));

      await expect(handleOrganizeAllTabs(1)).resolves.toBeUndefined();
    });
  });

  describe('reposition & collapse', () => {
    it('moves each group to index 0 in reverse order then collapses all', async () => {
      mockedGetSettings.mockResolvedValue(makeSettings());
      mockedBrowser.tabs.query.mockResolvedValueOnce([]);
      mockedBrowser.tabs.query.mockResolvedValueOnce([]);

      const groups = [{ id: 1 }, { id: 2 }, { id: 3 }];
      mockedBrowser.tabGroups.query.mockResolvedValueOnce(groups);
      mockedBrowser.tabs.query
        .mockResolvedValueOnce([{ index: 10 }])
        .mockResolvedValueOnce([{ index: 2 }])
        .mockResolvedValueOnce([{ index: 15 }]);

      await handleOrganizeAllTabs(99);

      const moveCalls = mockedBrowser.tabGroups.move.mock.calls;
      expect(moveCalls).toHaveLength(3);
      expect(moveCalls[0]).toEqual([3, { index: 0 }]);
      expect(moveCalls[1]).toEqual([1, { index: 0 }]);
      expect(moveCalls[2]).toEqual([2, { index: 0 }]);

      const updateCalls = mockedBrowser.tabGroups.update.mock.calls;
      expect(updateCalls).toHaveLength(3);
      expect(updateCalls[0]).toEqual([2, { collapsed: true }]);
      expect(updateCalls[1]).toEqual([1, { collapsed: true }]);
      expect(updateCalls[2]).toEqual([3, { collapsed: true }]);
    });

    it('does nothing when there are no groups in the window', async () => {
      mockedGetSettings.mockResolvedValue(makeSettings());
      mockedBrowser.tabs.query.mockResolvedValueOnce([]);
      mockedBrowser.tabs.query.mockResolvedValueOnce([]);
      mockedBrowser.tabGroups.query.mockResolvedValueOnce([]);

      await handleOrganizeAllTabs(1);

      expect(mockedBrowser.tabGroups.move).not.toHaveBeenCalled();
      expect(mockedBrowser.tabGroups.update).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('filters out non-organizable URLs (chrome://, chrome-extension://, about:)', async () => {
      const rule = makeRule();
      mockedGetSettings.mockResolvedValue(makeSettings({ domainRules: [rule] }));

      mockedBrowser.tabs.query.mockResolvedValueOnce([
        makeTab(1, 'chrome://settings', { index: 0 }),
        makeTab(2, 'chrome-extension://abc', { index: 1 }),
        makeTab(3, 'about:blank', { index: 2 }),
        makeTab(4, undefined as unknown as string, { index: 3 }),
      ]);
      mockedBrowser.tabs.query.mockResolvedValueOnce([]);

      await handleOrganizeAllTabs(1);

      expect(mockedFindMatchingRule).not.toHaveBeenCalled();
      expect(mockedBrowser.tabs.remove).not.toHaveBeenCalled();
    });

    it('handles an empty window with no side effects except settings load', async () => {
      mockedGetSettings.mockResolvedValue(makeSettings());
      mockedBrowser.tabs.query.mockResolvedValueOnce([]);
      mockedBrowser.tabs.query.mockResolvedValueOnce([]);

      await handleOrganizeAllTabs(1);

      expect(mockedGetSettings).toHaveBeenCalledOnce();
      expect(mockedBrowser.tabs.remove).not.toHaveBeenCalled();
      expect(mockedCreateGroup).not.toHaveBeenCalled();
      expect(mockedBrowser.notifications.create).not.toHaveBeenCalled();
    });
  });
});
