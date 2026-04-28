/**
 * Covers the async flow functions in background/grouping.ts that
 * tests/grouping.test.ts doesn't exercise:
 *
 *   createNewGroup · addToExistingGroup · handleManualGroupNaming
 *   performGroupingOperation · processGroupingForNewTab
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { makeRule, makeSettings, tab, type MockedBrowser } from './_helpers';

// ---- Mocks ------------------------------------------------------------------

vi.mock('wxt/browser', async () => ({ browser: (await import('./_helpers')).browserMock() }));

vi.mock('../../src/utils/statisticsUtils.js', () => ({
  incrementStat: vi.fn(),
}));

vi.mock('../../src/background/settings.js', () => ({
  getSettings: vi.fn(),
}));

vi.mock('../../src/background/messaging.js', () => ({
  promptForGroupName: vi.fn(),
}));

vi.mock('../../src/utils/notifications.js', () => ({
  showNotification: vi.fn(),
}));

vi.mock('../../src/utils/i18n.js', () => ({
  getMessage: vi.fn((k: string) => k),
}));

// ---- Imports after mocks ----------------------------------------------------

import {
  createNewGroup,
  addToExistingGroup,
  handleManualGroupNaming,
  performGroupingOperation,
  processGroupingForNewTab,
  type GroupingContext,
} from '../../src/background/grouping';
import { browser } from 'wxt/browser';
import { incrementStat } from '../../src/utils/statisticsUtils';
import { getSettings } from '../../src/background/settings';
import { promptForGroupName } from '../../src/background/messaging';
import { showNotification } from '../../src/utils/notifications';

// ---- Typed mock accessors ---------------------------------------------------

const mockedBrowser = browser as unknown as MockedBrowser;
const mockedIncrementStat = incrementStat as ReturnType<typeof vi.fn>;
const mockedGetSettings = getSettings as ReturnType<typeof vi.fn>;
const mockedPrompt = promptForGroupName as ReturnType<typeof vi.fn>;
const mockedShowNotif = showNotification as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  mockedBrowser.tabs.group.mockResolvedValue(99);
  mockedBrowser.tabGroups.update.mockResolvedValue(undefined);
  mockedBrowser.tabs.ungroup.mockResolvedValue(undefined);
  mockedBrowser.windows.get.mockResolvedValue({ id: 1, type: 'normal' });
  mockedIncrementStat.mockResolvedValue(undefined);
});

// -----------------------------------------------------------------------------

describe('createNewGroup', () => {
  it('groups the given tabs and updates title + color + collapsed=false', async () => {
    const id = await createNewGroup([10, 11], 'Work', 'blue', 'rule-1');

    expect(id).toBe(99);
    expect(mockedBrowser.tabs.group).toHaveBeenCalledWith({ tabIds: [10, 11] });
    expect(mockedBrowser.tabGroups.update).toHaveBeenCalledWith(99, {
      title: 'Work',
      collapsed: false,
      color: 'blue',
    });
    expect(mockedIncrementStat).toHaveBeenCalledWith('grouping', 'rule-1');
  });

  it('omits color from the update payload when groupColor is null', async () => {
    await createNewGroup([12], 'NoColor', null, 'rule-2');

    expect(mockedBrowser.tabGroups.update).toHaveBeenCalledWith(99, {
      title: 'NoColor',
      collapsed: false,
    });
  });
});

describe('addToExistingGroup', () => {
  it('adds the tab to the group and expands it', async () => {
    await addToExistingGroup(7, 42);

    expect(mockedBrowser.tabs.group).toHaveBeenCalledWith({ groupId: 7, tabIds: [42] });
    expect(mockedBrowser.tabGroups.update).toHaveBeenCalledWith(7, { collapsed: false });
    expect(mockedIncrementStat).not.toHaveBeenCalled();
  });
});

describe('handleManualGroupNaming', () => {
  it('returns early when the rule is not manual/smart_manual', async () => {
    await handleManualGroupNaming(makeRule({ groupNameSource: 'title' }), 7, 'Default', [1], 10);
    expect(mockedPrompt).not.toHaveBeenCalled();
    expect(mockedBrowser.tabGroups.update).not.toHaveBeenCalled();
  });

  it('returns early when targetGroupId is 0', async () => {
    await handleManualGroupNaming(makeRule({ groupNameSource: 'manual' }), 0, 'Default', [1], 10);
    expect(mockedPrompt).not.toHaveBeenCalled();
  });

  it('renames the group when the user provides a new name', async () => {
    mockedPrompt.mockResolvedValue('My Custom Name');

    await handleManualGroupNaming(
      makeRule({ groupNameSource: 'manual' }),
      7,
      'Default',
      [1, 2],
      10,
    );

    expect(mockedPrompt).toHaveBeenCalledWith('Default', 10);
    expect(mockedBrowser.tabGroups.update).toHaveBeenCalledWith(7, { title: 'My Custom Name' });
    expect(mockedBrowser.tabs.ungroup).not.toHaveBeenCalled();
  });

  it('does nothing when the user confirms the default name', async () => {
    mockedPrompt.mockResolvedValue('Default');

    await handleManualGroupNaming(
      makeRule({ groupNameSource: 'smart_manual' }),
      7,
      'Default',
      [1],
      10,
    );

    expect(mockedBrowser.tabGroups.update).not.toHaveBeenCalled();
    expect(mockedBrowser.tabs.ungroup).not.toHaveBeenCalled();
  });

  it('ungroups the tabs when the user cancels the prompt', async () => {
    mockedPrompt.mockResolvedValue(null);

    await handleManualGroupNaming(
      makeRule({ groupNameSource: 'manual' }),
      7,
      'Default',
      [10, 11],
      5,
    );

    expect(mockedBrowser.tabs.ungroup).toHaveBeenCalledWith([10, 11]);
    expect(mockedBrowser.tabGroups.update).not.toHaveBeenCalled();
  });

  it('swallows ungroup errors on cancel', async () => {
    mockedPrompt.mockResolvedValue(null);
    mockedBrowser.tabs.ungroup.mockRejectedValue(new Error('boom'));

    await expect(
      handleManualGroupNaming(
        makeRule({ groupNameSource: 'manual' }),
        7,
        'Default',
        [10],
        5,
      ),
    ).resolves.toBeUndefined();
  });
});

describe('performGroupingOperation', () => {
  function makeContext(overrides: Partial<GroupingContext> = {}): GroupingContext {
    return {
      rule: makeRule(),
      groupName: 'My Group',
      groupColor: 'blue',
      openerTab: tab(1) as any,
      newTab: tab(2) as any,
      ...overrides,
    };
  }

  it('creates a new group when the opener has no group (TAB_ID_NONE)', async () => {
    mockedBrowser.tabs.get.mockResolvedValue(tab(1, { groupId: -1 }));

    const { targetGroupId, groupedTabIds } = await performGroupingOperation(makeContext());

    expect(targetGroupId).toBe(99);
    expect(groupedTabIds).toEqual([1, 2]);
    expect(mockedBrowser.tabs.group).toHaveBeenCalledWith({ tabIds: [1, 2] });
  });

  it('creates a new group when the opener groupId is 0 (invalid)', async () => {
    mockedBrowser.tabs.get.mockResolvedValue(tab(1, { groupId: 0 }));

    await performGroupingOperation(makeContext());

    expect(mockedBrowser.tabs.group).toHaveBeenCalledWith({ tabIds: [1, 2] });
  });

  it('adds the new tab to the existing group when the opener is already grouped', async () => {
    mockedBrowser.tabs.get.mockResolvedValue(tab(1, { groupId: 55 }));

    const { targetGroupId, groupedTabIds } = await performGroupingOperation(makeContext());

    expect(targetGroupId).toBe(55);
    expect(groupedTabIds).toEqual([2]);
    expect(mockedBrowser.tabs.group).toHaveBeenCalledWith({ groupId: 55, tabIds: [2] });
  });
});

describe('processGroupingForNewTab', () => {
  it('does nothing when globalGroupingEnabled is false', async () => {
    mockedGetSettings.mockResolvedValue(makeSettings({ globalGroupingEnabled: false }));

    await processGroupingForNewTab(tab(1) as any, tab(2) as any);

    expect(mockedBrowser.tabs.group).not.toHaveBeenCalled();
  });

  it('does nothing when opener URL is missing', async () => {
    mockedGetSettings.mockResolvedValue(makeSettings());

    await processGroupingForNewTab(tab(1, { url: undefined }) as any, tab(2) as any);

    expect(mockedBrowser.tabs.group).not.toHaveBeenCalled();
  });

  it('skips when opener is in a non-normal window (PWA / installed app)', async () => {
    mockedGetSettings.mockResolvedValue(makeSettings({ domainRules: [makeRule()] }));
    mockedBrowser.windows.get.mockResolvedValue({ id: 1, type: 'popup' });

    await processGroupingForNewTab(tab(1) as any, tab(2) as any);

    expect(mockedBrowser.tabs.group).not.toHaveBeenCalled();
  });

  it('tolerates windows.get failing (still proceeds)', async () => {
    mockedGetSettings.mockResolvedValue(makeSettings({ domainRules: [makeRule()] }));
    mockedBrowser.windows.get.mockRejectedValue(new Error('no window'));
    mockedBrowser.tabs.get.mockResolvedValue(tab(1));

    await processGroupingForNewTab(tab(1) as any, tab(2) as any);

    expect(mockedBrowser.tabs.group).toHaveBeenCalled();
  });

  it('skips when no rule matches the opener URL', async () => {
    mockedGetSettings.mockResolvedValue(makeSettings({ domainRules: [] }));

    await processGroupingForNewTab(tab(1) as any, tab(2) as any);

    expect(mockedBrowser.tabs.group).not.toHaveBeenCalled();
  });

  it('skips when the matching rule has groupingEnabled=false', async () => {
    mockedGetSettings.mockResolvedValue(
      makeSettings({ domainRules: [makeRule({ groupingEnabled: false })] }),
    );

    await processGroupingForNewTab(tab(1) as any, tab(2) as any);

    expect(mockedBrowser.tabs.group).not.toHaveBeenCalled();
  });

  it('skips when the rule extracts no group name (smart mode with no match)', async () => {
    mockedGetSettings.mockResolvedValue(
      makeSettings({ domainRules: [makeRule({ groupNameSource: 'smart' })] }),
    );

    await processGroupingForNewTab(tab(1) as any, tab(2) as any);

    expect(mockedBrowser.tabs.group).not.toHaveBeenCalled();
  });

  it('performs full grouping and shows a notification when notifyOnGrouping is true', async () => {
    mockedGetSettings.mockResolvedValue(
      makeSettings({ domainRules: [makeRule()] }),
    );
    mockedBrowser.tabs.get.mockResolvedValue(tab(1, { groupId: -1 }));

    await processGroupingForNewTab(tab(1) as any, tab(2) as any);

    expect(mockedBrowser.tabs.group).toHaveBeenCalledWith({ tabIds: [1, 2] });
    expect(mockedShowNotif).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'notificationGroupingTitle',
        type: 'success',
        undoAction: { type: 'ungroup', data: { tabIds: [1, 2] } },
      }),
    );
  });

  it('does not show a notification when notifyOnGrouping is false', async () => {
    mockedGetSettings.mockResolvedValue(
      makeSettings({ domainRules: [makeRule()], notifyOnGrouping: false }),
    );
    mockedBrowser.tabs.get.mockResolvedValue(tab(1, { groupId: -1 }));

    await processGroupingForNewTab(tab(1) as any, tab(2) as any);

    expect(mockedBrowser.tabs.group).toHaveBeenCalled();
    expect(mockedShowNotif).not.toHaveBeenCalled();
  });

  it('prompts for a manual name when rule.groupNameSource is "manual"', async () => {
    mockedGetSettings.mockResolvedValue(
      makeSettings({ domainRules: [makeRule({ groupNameSource: 'manual' })] }),
    );
    mockedBrowser.tabs.get.mockResolvedValue(tab(1, { groupId: -1 }));
    mockedPrompt.mockResolvedValue('Renamed');

    await processGroupingForNewTab(tab(1) as any, tab(2) as any);

    expect(mockedPrompt).toHaveBeenCalled();
    expect(mockedBrowser.tabGroups.update).toHaveBeenCalledWith(99, { title: 'Renamed' });
  });

  it('does NOT prompt for smart_manual when extraction succeeded', async () => {
    const rule = makeRule({
      groupNameSource: 'smart_manual',
      titleParsingRegEx: 'Example (Page)',
    });
    mockedGetSettings.mockResolvedValue(makeSettings({ domainRules: [rule] }));
    mockedBrowser.tabs.get.mockResolvedValue(tab(1, { groupId: -1 }));

    await processGroupingForNewTab(
      tab(1, { title: 'Example Page' }) as any,
      tab(2) as any,
    );

    expect(mockedPrompt).not.toHaveBeenCalled();
  });

  it('DOES prompt for smart_manual when extraction failed', async () => {
    mockedGetSettings.mockResolvedValue(
      makeSettings({ domainRules: [makeRule({ groupNameSource: 'smart_manual' })] }),
    );
    mockedBrowser.tabs.get.mockResolvedValue(tab(1, { groupId: -1 }));
    mockedPrompt.mockResolvedValue('ManualName');

    await processGroupingForNewTab(tab(1) as any, tab(2) as any);

    expect(mockedPrompt).toHaveBeenCalled();
  });

  it('catches errors from the grouping operation without throwing', async () => {
    mockedGetSettings.mockResolvedValue(
      makeSettings({ domainRules: [makeRule()] }),
    );
    mockedBrowser.tabs.get.mockResolvedValue(tab(1, { groupId: -1 }));
    mockedBrowser.tabs.group.mockRejectedValue(new Error('No tab with id 2'));

    await expect(
      processGroupingForNewTab(tab(1) as any, tab(2) as any),
    ).resolves.toBeUndefined();
  });

  it('matches the "cannot group tab in a closed window" error branch', async () => {
    mockedGetSettings.mockResolvedValue(
      makeSettings({ domainRules: [makeRule()] }),
    );
    mockedBrowser.tabs.get.mockResolvedValue(tab(1, { groupId: -1 }));
    mockedBrowser.tabs.group.mockRejectedValue(
      new Error('Cannot group tab in a closed window'),
    );

    await expect(
      processGroupingForNewTab(tab(1) as any, tab(2) as any),
    ).resolves.toBeUndefined();
  });
});
