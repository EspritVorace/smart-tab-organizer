import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing';

beforeEach(() => {
  fakeBrowser.reset();
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('initializeDefaults — fresh install', () => {
  it('writes empty rules and default toggles when storage is empty', async () => {
    const { initializeDefaults } = await import('../src/utils/migration');
    const { getSettings } = await import('../src/utils/settingsUtils');

    await initializeDefaults();

    const stored = await getSettings();
    // Plus de seed initial : les packs (PackGallery) servent à peupler les règles.
    expect(stored.domainRules).toEqual([]);
    expect(stored.globalGroupingEnabled).toBe(true);
    expect(stored.globalDeduplicationEnabled).toBe(true);
    expect(stored.deduplicateUnmatchedDomains).toBe(false);
    expect(stored.deduplicationKeepStrategy).toBe('keep-grouped-or-new');
    expect(stored.notifyOnGrouping).toBe(true);
    expect(stored.notifyOnDeduplication).toBe(true);
    expect(stored.notifyOnOrganize).toBe(true);
  });

  it('initializes default statistics when storage.local has no statistics', async () => {
    const { initializeDefaults } = await import('../src/utils/migration');

    await initializeDefaults();

    const { statistics } = await fakeBrowser.storage.local.get('statistics');
    expect(statistics).toBeDefined();
    expect((statistics as any).tabGroupsCreatedCount).toBe(0);
    expect((statistics as any).tabsDeduplicatedCount).toBe(0);
  });
});

describe('initializeDefaults — upgrade path', () => {
  it('preserves existing settings and merges with defaults (existing wins)', async () => {
    await fakeBrowser.storage.local.set({
      domainRules: [
        {
          id: 'existing-rule',
          label: 'My Custom Label',
          domainFilter: 'custom.com',
          enabled: true,
          color: 'red',
          groupNameSource: 'label',
          titleParsingRegEx: '',
          urlParsingRegEx: '',
        },
      ],
      globalGroupingEnabled: false,
    });

    const { initializeDefaults } = await import('../src/utils/migration');
    const { getSettings } = await import('../src/utils/settingsUtils');

    await initializeDefaults();

    const merged = await getSettings();
    expect(merged.globalGroupingEnabled).toBe(false);
    expect(merged.domainRules).toHaveLength(1);
    expect(merged.domainRules[0].label).toBe('My Custom Label');
    expect(merged.domainRules[0].color).toBe('red');
  });

  it('falls back to domainFilter for a label when missing', async () => {
    await fakeBrowser.storage.local.set({
      domainRules: [
        {
          id: 'unknown-id',
          domainFilter: 'custom.com',
          enabled: true,
          color: 'green',
        },
      ],
    });

    const { initializeDefaults } = await import('../src/utils/migration');
    const { getSettings } = await import('../src/utils/settingsUtils');

    await initializeDefaults();

    expect((await getSettings()).domainRules[0].label).toBe('custom.com');
  });

  it('falls back to "Untitled Rule" when both default and domainFilter are missing', async () => {
    await fakeBrowser.storage.local.set({
      domainRules: [{ id: 'orphan', enabled: true, color: 'grey' }],
    });

    const { initializeDefaults } = await import('../src/utils/migration');
    const { getSettings } = await import('../src/utils/settingsUtils');

    await initializeDefaults();

    expect((await getSettings()).domainRules[0].label).toBe('Untitled Rule');
  });

  it('removes the legacy groupId field from existing rules', async () => {
    await fakeBrowser.storage.local.set({
      domainRules: [
        {
          id: 'legacy',
          label: 'Legacy',
          domainFilter: 'legacy.com',
          enabled: true,
          color: 'blue',
          groupId: 999,
        },
      ],
    });

    const { initializeDefaults } = await import('../src/utils/migration');

    await initializeDefaults();

    const { domainRules } = await fakeBrowser.storage.local.get('domainRules');
    expect(domainRules).toBeDefined();
    expect((domainRules as any)[0].groupId).toBeUndefined();
  });

  it('injects default color "grey" when the rule has no color', async () => {
    await fakeBrowser.storage.local.set({
      domainRules: [
        { id: 'no-color', label: 'X', domainFilter: 'x.com', enabled: true },
      ],
    });

    const { initializeDefaults } = await import('../src/utils/migration');
    const { getSettings } = await import('../src/utils/settingsUtils');

    await initializeDefaults();
    expect((await getSettings()).domainRules[0].color).toBe('grey');
  });

  it('injects default urlParsingRegEx = "" when missing', async () => {
    await fakeBrowser.storage.local.set({
      domainRules: [
        {
          id: 'no-url-regex',
          label: 'X',
          domainFilter: 'x.com',
          enabled: true,
          color: 'blue',
        },
      ],
    });

    const { initializeDefaults } = await import('../src/utils/migration');
    const { getSettings } = await import('../src/utils/settingsUtils');

    await initializeDefaults();
    expect((await getSettings()).domainRules[0].urlParsingRegEx).toBe('');
  });

  it('injects default groupNameSource = "title" when missing', async () => {
    await fakeBrowser.storage.local.set({
      domainRules: [
        {
          id: 'no-source',
          label: 'X',
          domainFilter: 'x.com',
          enabled: true,
          color: 'blue',
        },
      ],
    });

    const { initializeDefaults } = await import('../src/utils/migration');
    const { getSettings } = await import('../src/utils/settingsUtils');

    await initializeDefaults();
    expect((await getSettings()).domainRules[0].groupNameSource).toBe('title');
  });

  it('does not overwrite an explicit user choice for deduplicationKeepStrategy on upgrade', async () => {
    await fakeBrowser.storage.local.set({
      domainRules: [
        { id: 'r1', label: 'R', domainFilter: 'r.com', enabled: true, color: 'blue' },
      ],
      deduplicationKeepStrategy: 'keep-old',
    });

    const { initializeDefaults } = await import('../src/utils/migration');
    const { getSettings } = await import('../src/utils/settingsUtils');

    await initializeDefaults();

    const merged = await getSettings();
    expect(merged.deduplicationKeepStrategy).toBe('keep-old');
  });

  it('does not overwrite existing statistics on upgrade', async () => {
    await fakeBrowser.storage.local.set({
      domainRules: [
        { id: 'existing', label: 'X', domainFilter: 'x.com', enabled: true, color: 'blue' },
      ],
    });
    await fakeBrowser.storage.local.set({
      statistics: { tabGroupsCreatedCount: 42, tabsDeduplicatedCount: 7 },
    });

    const { initializeDefaults } = await import('../src/utils/migration');

    await initializeDefaults();

    const { statistics } = await fakeBrowser.storage.local.get('statistics');
    expect((statistics as any).tabGroupsCreatedCount).toBe(42);
    expect((statistics as any).tabsDeduplicatedCount).toBe(7);
  });
});

describe('migrateRuleColorsFromCategories', () => {
  it('copies the legacy category color onto a rule that has only categoryId', async () => {
    await fakeBrowser.storage.local.set({
      domainRules: [
        { id: 'r1', label: 'Jira', domainFilter: '*.atlassian.net', enabled: true, categoryId: 'development' },
        { id: 'r2', label: 'Trello', domainFilter: 'trello.com', enabled: true, categoryId: 'productivity' },
      ],
    });

    const { migrateRuleColorsFromCategories } = await import('../src/utils/migration');

    await migrateRuleColorsFromCategories();

    const { domainRules } = await fakeBrowser.storage.local.get('domainRules');
    expect((domainRules as any)[0].color).toBe('blue');
    expect((domainRules as any)[1].color).toBe('purple');
  });

  it('does not overwrite an existing rule color', async () => {
    await fakeBrowser.storage.local.set({
      domainRules: [
        { id: 'r1', label: 'X', domainFilter: 'x.com', enabled: true, categoryId: 'development', color: 'red' },
      ],
    });

    const { migrateRuleColorsFromCategories } = await import('../src/utils/migration');

    await migrateRuleColorsFromCategories();

    const { domainRules } = await fakeBrowser.storage.local.get('domainRules');
    expect((domainRules as any)[0].color).toBe('red');
  });

  it('is idempotent across two calls', async () => {
    await fakeBrowser.storage.local.set({
      domainRules: [
        { id: 'r1', label: 'X', domainFilter: 'x.com', enabled: true, categoryId: 'development' },
      ],
    });

    const { migrateRuleColorsFromCategories } = await import('../src/utils/migration');

    await migrateRuleColorsFromCategories();
    // Simulate a user changing the color, then a second migration call.
    const stored = await fakeBrowser.storage.local.get('domainRules');
    (stored.domainRules as any)[0].color = 'orange';
    await fakeBrowser.storage.local.set({ domainRules: stored.domainRules });

    await migrateRuleColorsFromCategories();

    const { domainRules } = await fakeBrowser.storage.local.get('domainRules');
    // The flag was set during the first run, so the second run is a no-op.
    expect((domainRules as any)[0].color).toBe('orange');
  });

  it('leaves rules without a known categoryId untouched', async () => {
    await fakeBrowser.storage.local.set({
      domainRules: [
        { id: 'r1', label: 'X', domainFilter: 'x.com', enabled: true, categoryId: 'unknown-category' },
        { id: 'r2', label: 'Y', domainFilter: 'y.com', enabled: true, categoryId: null },
      ],
    });

    const { migrateRuleColorsFromCategories } = await import('../src/utils/migration');

    await migrateRuleColorsFromCategories();

    const { domainRules } = await fakeBrowser.storage.local.get('domainRules');
    expect((domainRules as any)[0].color).toBeUndefined();
    expect((domainRules as any)[1].color).toBeUndefined();
  });
});
