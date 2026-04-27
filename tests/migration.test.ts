import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import type { AppSettings, DomainRuleSetting } from '../src/types/syncSettings';

// The fetch response body returned by loadDefaultSettings() when the
// extension is first installed or upgraded.
const TEST_DEFAULTS: AppSettings = {
  globalGroupingEnabled: true,
  globalDeduplicationEnabled: true,
  deduplicateUnmatchedDomains: false,
  deduplicationKeepStrategy: 'keep-grouped-or-new',
  categories: [],
  notifyOnGrouping: true,
  notifyOnDeduplication: true,
  domainRules: [
    {
      id: 'default-rule-1',
      label: 'Default Label',
      domainFilter: 'example.com',
      enabled: true,
      color: 'blue',
      groupNameSource: 'title',
      titleParsingRegEx: '',
      urlParsingRegEx: '',
    } as DomainRuleSetting,
  ],
};

function mockOkFetch(body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    statusText: 'OK',
    json: async () => body,
  });
}

beforeEach(() => {
  fakeBrowser.reset();
  // Reset the module cache so migration.ts's cachedDefaultSettings is cleared
  // between tests. Without this, the first test's fetched defaults leak into
  // every subsequent test.
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('initializeDefaults — fresh install', () => {
  it('writes default settings when domainRules is absent from storage', async () => {
    vi.stubGlobal('fetch', mockOkFetch(TEST_DEFAULTS));
    const { initializeDefaults } = await import('../src/utils/migration');
    const { getSettings } = await import('../src/utils/settingsUtils');

    await initializeDefaults();

    const stored = await getSettings();
    expect(stored.globalGroupingEnabled).toBe(true);
    expect(stored.domainRules).toHaveLength(1);
    expect(stored.domainRules[0].id).toBe('default-rule-1');
  });

  it('initializes default statistics when storage.local has no statistics', async () => {
    vi.stubGlobal('fetch', mockOkFetch(TEST_DEFAULTS));
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
    vi.stubGlobal('fetch', mockOkFetch(TEST_DEFAULTS));
    // Seed an existing rule with a distinct label — merge should keep it.
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
      globalGroupingEnabled: false, // non-default value
    });

    const { initializeDefaults } = await import('../src/utils/migration');
    const { getSettings } = await import('../src/utils/settingsUtils');

    await initializeDefaults();

    const merged = await getSettings();
    expect(merged.globalGroupingEnabled).toBe(false); // existing preserved
    expect(merged.domainRules).toHaveLength(1);
    expect(merged.domainRules[0].label).toBe('My Custom Label');
    expect(merged.domainRules[0].color).toBe('red');
  });

  it('injects a label on a rule missing it, using the matching default rule', async () => {
    vi.stubGlobal('fetch', mockOkFetch(TEST_DEFAULTS));
    await fakeBrowser.storage.local.set({
      domainRules: [
        {
          id: 'default-rule-1', // matches TEST_DEFAULTS
          domainFilter: 'example.com',
          enabled: true,
          color: 'blue',
        },
      ],
    });

    const { initializeDefaults } = await import('../src/utils/migration');
    const { getSettings } = await import('../src/utils/settingsUtils');

    await initializeDefaults();

    const merged = await getSettings();
    expect(merged.domainRules[0].label).toBe('Default Label');
  });

  it('falls back to domainFilter for a label when no default rule matches', async () => {
    vi.stubGlobal('fetch', mockOkFetch(TEST_DEFAULTS));
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
    vi.stubGlobal('fetch', mockOkFetch(TEST_DEFAULTS));
    await fakeBrowser.storage.local.set({
      domainRules: [{ id: 'orphan', enabled: true, color: 'grey' }],
    });

    const { initializeDefaults } = await import('../src/utils/migration');
    const { getSettings } = await import('../src/utils/settingsUtils');

    await initializeDefaults();

    expect((await getSettings()).domainRules[0].label).toBe('Untitled Rule');
  });

  it('removes the legacy groupId field from existing rules', async () => {
    vi.stubGlobal('fetch', mockOkFetch(TEST_DEFAULTS));
    await fakeBrowser.storage.local.set({
      domainRules: [
        {
          id: 'legacy',
          label: 'Legacy',
          domainFilter: 'legacy.com',
          enabled: true,
          color: 'blue',
          groupId: 999, // legacy field to strip
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
    vi.stubGlobal('fetch', mockOkFetch(TEST_DEFAULTS));
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
    vi.stubGlobal('fetch', mockOkFetch(TEST_DEFAULTS));
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
    vi.stubGlobal('fetch', mockOkFetch(TEST_DEFAULTS));
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
    vi.stubGlobal('fetch', mockOkFetch(TEST_DEFAULTS));
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
    vi.stubGlobal('fetch', mockOkFetch(TEST_DEFAULTS));
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

describe('initializeDefaults — fetch failures', () => {
  it('falls back to defaultAppSettings when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
    const { initializeDefaults } = await import('../src/utils/migration');
    const { getSettings } = await import('../src/utils/settingsUtils');

    await initializeDefaults();

    // defaultSyncSettings.domainRules is empty — migration wrote that.
    const stored = await getSettings();
    expect(stored.domainRules).toEqual([]);
    expect(stored.globalGroupingEnabled).toBe(true);
  });

  it('falls back when fetch returns a non-ok response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, statusText: 'Not Found', json: async () => ({}) }),
    );
    const { initializeDefaults } = await import('../src/utils/migration');
    const { getSettings } = await import('../src/utils/settingsUtils');

    await initializeDefaults();

    const stored = await getSettings();
    expect(stored.domainRules).toEqual([]);
  });
});

describe('initializeDefaults — cache behavior', () => {
  it('caches default settings across two calls within the same module instance', async () => {
    const fetchMock = mockOkFetch(TEST_DEFAULTS);
    vi.stubGlobal('fetch', fetchMock);
    const { initializeDefaults } = await import('../src/utils/migration');

    await initializeDefaults();
    await initializeDefaults();

    // fetch was only called once thanks to the in-module cache.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
