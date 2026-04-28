import { describe, it, expect } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import { migrateSettingsFromSyncToLocal, migrateRulesAddUrlExtractionMode } from '../../src/background/migration';

describe('migrateSettingsFromSyncToLocal', () => {
  it('sets the migration flag after running on a fresh install', async () => {
    await migrateSettingsFromSyncToLocal();
    const state = await fakeBrowser.storage.local.get('settingsMigratedToLocal');
    expect(state.settingsMigratedToLocal).toBe(true);
  });

  it('is idempotent: does nothing when migration flag is already set', async () => {
    await fakeBrowser.storage.local.set({ settingsMigratedToLocal: true });
    // Should return early without error
    await expect(migrateSettingsFromSyncToLocal()).resolves.toBeUndefined();
  });

  it('copies settings from sync to local when sync has data and local does not', async () => {
    await fakeBrowser.storage.sync.set({ globalGroupingEnabled: false });
    await migrateSettingsFromSyncToLocal();
    const local = await fakeBrowser.storage.local.get('globalGroupingEnabled');
    expect(local.globalGroupingEnabled).toBe(false);
  });

  it('does not overwrite local settings that already exist', async () => {
    await fakeBrowser.storage.sync.set({ globalGroupingEnabled: false });
    await fakeBrowser.storage.local.set({ globalGroupingEnabled: true });
    await migrateSettingsFromSyncToLocal();
    const local = await fakeBrowser.storage.local.get('globalGroupingEnabled');
    expect(local.globalGroupingEnabled).toBe(true);
  });

  it('completes without error when sync storage is empty', async () => {
    await expect(migrateSettingsFromSyncToLocal()).resolves.toBeUndefined();
    const state = await fakeBrowser.storage.local.get('settingsMigratedToLocal');
    expect(state.settingsMigratedToLocal).toBe(true);
  });
});

describe('migrateRulesAddUrlExtractionMode', () => {
  it('adds urlExtractionMode="regex" to legacy rules that lack it', async () => {
    await fakeBrowser.storage.local.set({
      domainRules: [
        { id: 'r1', label: 'Foo' },
        { id: 'r2', label: 'Bar', urlExtractionMode: 'query_param', urlQueryParamName: 'q' },
      ],
    });

    await migrateRulesAddUrlExtractionMode();

    const result = await fakeBrowser.storage.local.get('domainRules');
    const rules = result.domainRules as Array<{ id: string; urlExtractionMode?: string }>;
    expect(rules[0].urlExtractionMode).toBe('regex');
    expect(rules[1].urlExtractionMode).toBe('query_param');
  });

  it('sets the migration flag after running', async () => {
    await migrateRulesAddUrlExtractionMode();
    const state = await fakeBrowser.storage.local.get('urlExtractionModeMigrated');
    expect(state.urlExtractionModeMigrated).toBe(true);
  });

  it('is idempotent when called twice', async () => {
    await fakeBrowser.storage.local.set({
      domainRules: [{ id: 'r1', label: 'Foo' }],
    });

    await migrateRulesAddUrlExtractionMode();
    // Manually clear the field to verify migration does NOT re-apply on second call
    const after1 = await fakeBrowser.storage.local.get('domainRules');
    (after1.domainRules as Array<{ urlExtractionMode?: string }>)[0].urlExtractionMode = undefined;
    await fakeBrowser.storage.local.set({ domainRules: after1.domainRules });

    await migrateRulesAddUrlExtractionMode();

    const after2 = await fakeBrowser.storage.local.get('domainRules');
    // The flag is still set, so migration is skipped — field stays undefined
    expect((after2.domainRules as Array<{ urlExtractionMode?: string }>)[0].urlExtractionMode).toBeUndefined();
  });

  it('completes without error when domainRules is missing', async () => {
    await expect(migrateRulesAddUrlExtractionMode()).resolves.toBeUndefined();
    const state = await fakeBrowser.storage.local.get('urlExtractionModeMigrated');
    expect(state.urlExtractionModeMigrated).toBe(true);
  });
});
